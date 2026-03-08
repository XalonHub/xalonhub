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

// PUT /api/customers/:id – update profile (name, gender, email, dob, profileImage)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, email, dob, profileImage } = req.body;
    const updated = await prisma.customerProfile.update({
      where: { id },
      data: { name, gender, email, dob, profileImage },
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

    // [UNIQUE LABEL CHECK]
    const existing = await prisma.savedAddress.findFirst({
      where: { customerId: id, label }
    });
    if (existing) {
      return res.status(400).json({ error: `An address with label '${label}' already exists.` });
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

    // [UNIQUE LABEL CHECK]
    const conflict = await prisma.savedAddress.findFirst({
      where: {
        customerId: id,
        label,
        id: { not: addrId }
      }
    });
    if (conflict) {
      return res.status(400).json({ error: `Another address with label '${label}' already exists.` });
    }

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

// DELETE /api/customers/:id/addresses/:addrId – delete (reset) a saved address
router.delete('/:id/addresses/:addrId', async (req, res) => {
  try {
    const { id, addrId } = req.params;
    console.log(`[BACKEND] Resetting address. Customer: ${id}, Address: ${addrId}`);

    const target = await prisma.savedAddress.findUnique({ where: { id: addrId } });
    if (!target) {
      console.log(`[BACKEND] Address ${addrId} not found`);
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.savedAddress.delete({ where: { id: addrId } });
    console.log(`[BACKEND] Deleted address: ${addrId} (${target.label})`);

    if (target.isDefault) {
      const nextOne = await prisma.savedAddress.findFirst({
        where: { customerId: id },
      });
      if (nextOne) {
        await prisma.savedAddress.update({
          where: { id: nextOne.id },
          data: { isDefault: true },
        });
        console.log(`[BACKEND] Shifted default to: ${nextOne.id} (${nextOne.label})`);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /customers/:id/addresses/:addrId', err);
    res.status(500).json({ error: 'Failed to reset address' });
  }
});

// ─── GUEST MANAGEMENT ──────────────────────────────────────────────

// GET /api/customers/:id/guests
router.get('/:id/guests', async (req, res) => {
  try {
    const { id } = req.params;
    const guests = await prisma.userGuest.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(guests);
  } catch (err) {
    console.error('GET /customers/:id/guests', err);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// POST /api/customers/:id/guests
router.post('/:id/guests', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobileNumber, relationship } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const guest = await prisma.userGuest.create({
      data: { customerId: id, name, mobileNumber, relationship }
    });
    res.status(201).json(guest);
  } catch (err) {
    console.error('POST /customers/:id/guests', err);
    res.status(500).json({ error: 'Failed to add guest' });
  }
});

// PUT /api/customers/:id/guests/:guestId
router.put('/:id/guests/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;
    const { name, mobileNumber, relationship } = req.body;
    const updated = await prisma.userGuest.update({
      where: { id: guestId },
      data: { name, mobileNumber, relationship }
    });
    res.json(updated);
  } catch (err) {
    console.error('PUT /customers/:id/guests/:guestId', err);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// DELETE /api/customers/:id/guests/:guestId
router.delete('/:id/guests/:guestId', async (req, res) => {
  try {
    const { guestId } = req.params;

    // Logic: Update bookings using this guestId to default "Guest"
    await prisma.booking.updateMany({
      where: { guestId },
      data: {
        guestId: null,
        beneficiaryName: 'Guest'
      }
    });

    await prisma.userGuest.delete({ where: { id: guestId } });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /customers/:id/guests/:guestId', err);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

module.exports = router;
