const { Op } = require('sequelize');
const {
  sequelize,
  Component,
  Inventory,
  Movement,
  User,
  Role,
  Category,
  Warehouse
} = require('../models');
const { getUserId } = require('./helpers');

const getMovements = async (req, res) => {
  const { search, type, tipo, id_almacen } = req.query;
  const movementType = type || tipo;

  const where = {};
  if (movementType) where.tipo = movementType.trim();
  if (id_almacen) where.id_almacen = id_almacen;

  const componentWhere = search
    ? {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search.trim()}%` } },
          { marca: { [Op.iLike]: `%${search.trim()}%` } },
          { modelo: { [Op.iLike]: `%${search.trim()}%` } }
        ]
      }
    : undefined;

  try {
    const movements = await Movement.findAll({
      where,
      include: [
        {
          model: Component,
          as: 'componente',
          where: componentWhere,
          required: Boolean(search),
          attributes: ['id_componente', 'nombre', 'marca', 'modelo', 'id_categoria'],
          include: [{ model: Category, as: 'categoria', attributes: ['id_categoria', 'nombre'] }]
        },
        {
          model: User,
          as: 'usuario',
          attributes: ['id_usuario', 'nombre', 'correo', 'id_rol'],
          include: [{ model: Role, as: 'rol', attributes: ['id_rol', 'nombre'] }]
        },
        {
          model: Warehouse,
          as: 'almacen',
          attributes: ['id_almacen', 'nombre', 'ubicacion']
        }
      ],
      order: [['fecha', 'DESC'], ['id_movimiento', 'DESC']]
    });

    const formattedList = movements.map(record => {
      const m = record.get({ plain: true });
      return {
        id: m.id_movimiento,
        id_movimiento: m.id_movimiento,
        productId: m.id_componente,
        id_componente: m.id_componente,
        productName: m.componente?.nombre || '',
        componente: m.componente?.nombre || '',
        category: m.componente?.categoria?.nombre || '',
        categoria: m.componente?.categoria?.nombre || '',
        warehouseId: m.id_almacen,
        id_almacen: m.id_almacen,
        warehouse: m.almacen?.nombre || '',
        almacen: m.almacen?.nombre || '',
        type: m.tipo,
        tipo: m.tipo,
        quantity: Number(m.cantidad || 0),
        cantidad: Number(m.cantidad || 0),
        reason: m.observacion || '',
        observacion: m.observacion || '',
        date: m.fecha ? new Date(m.fecha).toISOString() : null,
        fecha: m.fecha,
        user: m.usuario?.nombre || 'Usuario Eliminado',
        usuario: m.usuario?.nombre || 'Usuario Eliminado',
        role: m.usuario?.rol?.nombre || 'operario',
        rol: m.usuario?.rol?.nombre || 'operario'
      };
    });

    return res.json(formattedList);
  } catch (error) {
    console.error('Error fetching movements:', error);
    return res.status(500).json({ message: 'Error al obtener el historial de movimientos.' });
  }
};

const registerMovement = async (req, res) => {
  const {
    productId,
    id_componente,
    warehouseId,
    id_almacen,
    type,
    tipo,
    quantity,
    cantidad,
    reason,
    observacion
  } = req.body;

  const componentId = productId || id_componente;
  const warehouse = warehouseId || id_almacen;
  const userId = getUserId(req);

  if (!componentId || !warehouse || !(type || tipo) || !(quantity || cantidad)) {
    return res.status(400).json({
      message: 'Los campos productId/id_componente, warehouseId/id_almacen, type/tipo y quantity/cantidad son requeridos.'
    });
  }

  const movementType = (type || tipo).toLowerCase().trim();
  if (movementType !== 'entrada' && movementType !== 'salida') {
    return res.status(400).json({ message: 'El tipo debe ser entrada o salida.' });
  }

  const qty = parseInt(quantity || cantidad, 10);
  if (Number.isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un número entero mayor a cero.' });
  }

  const transaction = await sequelize.transaction();

  try {
    const component = await Component.findByPk(componentId, { transaction });
    if (!component) {
      await transaction.rollback();
      return res.status(404).json({ message: 'El componente de hardware no existe en el catálogo.' });
    }

    const warehouseRecord = await Warehouse.findByPk(warehouse, { transaction });
    if (!warehouseRecord) {
      await transaction.rollback();
      return res.status(404).json({ message: 'El almacén no existe.' });
    }

    let inventory = await Inventory.findOne({
      where: { id_componente: componentId, id_almacen: warehouse },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!inventory) {
      inventory = await Inventory.create({
        id_componente: componentId,
        id_almacen: warehouse,
        stock_actual: 0
      }, { transaction });
    }

    const currentStock = Number(inventory.stock_actual || 0);
    let newStock = currentStock;

    if (movementType === 'entrada') {
      newStock = currentStock + qty;
    } else {
      if (currentStock < qty) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Operación denegada. Stock insuficiente en almacén.' });
      }
      newStock = currentStock - qty;
    }

    await inventory.update({ stock_actual: newStock }, { transaction });

    await Movement.create({
      id_componente: componentId,
      id_usuario: userId,
      id_almacen: warehouse,
      tipo: movementType,
      cantidad: qty,
      fecha: new Date(),
      observacion: (observacion || reason || '').trim()
    }, { transaction });

    await transaction.commit();

    return res.status(201).json({
      message: `Movimiento de ${movementType} registrado con éxito.`,
      productId: component.id_componente,
      id_componente: component.id_componente,
      productName: component.nombre,
      componente: component.nombre,
      warehouseId: warehouseRecord.id_almacen,
      almacen: warehouseRecord.nombre,
      previousStock: currentStock,
      stockAnterior: currentStock,
      newStock,
      stockNuevo: newStock
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Movement registration transaction error:', error);
    return res.status(500).json({ message: 'Error interno del servidor al procesar el movimiento de almacén.' });
  }
};

module.exports = {
  getMovements,
  registerMovement
};
