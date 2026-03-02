const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// GET /api/customers/:id – fetch customer profile + addresses
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customerProfile.findUnique({
      where: { id },
      include: { addresses: true },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    console.error('GET /customers/:id', err);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// PUT /api/customers/:id – update name/gender (profile)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender } = req.body;
    const updated = await prisma.customerProfile.update({
      where: { id },
      data: { name, gender },
      include: { addresses: true },
    });
    res.json(updated);
  } catch (err) {
    console.error('PUT /customers/:id', err);
    res.status(500).json({ error: 'Failed to update customer profile' });
  }
});

// POST /api/customers/:id/addresses – add a saved address
router.post('/:id/addresses', async (req, res) => {
  try {
    const { id } = req.params;
    const { label, addressLine, state, district, city, pincode, lat, lng, isDefault } = req.body;

    if (!label || !addressLine || !state || !district || !city) {
      return res.status(400).json({ error: 'label, addressLine, state, district, and city are required' });
    }

    // If this is set as default, unset all others first
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { customerId: id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.savedAddress.create({
      data: { customerId: id, label, addressLine, state, district, city, pincode, lat, lng, isDefault: isDefault || false },
    });
    res.status(201).json(address);
  } catch (err) {
    console.error('POST /customers/:id/addresses', err);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// PUT /api/customers/:id/addresses/:addrId – edit a saved address
router.put('/:id/addresses/:addrId', async (req, res) => {
  try {
    const { id, addrId } = req.params;
    const { label, addressLine, state, district, city, pincode, lat, lng, isDefault } = req.body;

    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { customerId: id },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.savedAddress.update({
      where: { id: addrId },
      data: { label, addressLine, state, district, city, pincode, lat, lng, isDefault },
    });
    res.json(updated);
  } catch (err) {
    console.error('PUT /customers/:id/addresses/:addrId', err);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

module.exports = router;
