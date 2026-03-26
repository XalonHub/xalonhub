const prisma = require('../prisma');
const { getCloudinaryUrl, deleteAsset, getPublicId, CloudinaryResourceType } = require('../utils/cloudinaryHelper');

// Helper to format category images
const mapCategoryContent = (cat) => ({
    ...cat,
    image: cat.image ? getCloudinaryUrl(cat.image) : null
});

exports.getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(categories.map(mapCategoryContent));
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name is required' });

        const exists = await prisma.category.findUnique({ where: { name } });
        if (exists) return res.status(400).json({ error: 'Category with this name already exists' });

        const newCategory = await prisma.category.create({
            data: { 
                name,
                description: description || null,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json(mapCategoryContent(newCategory));
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image, description, isActive } = req.body;

        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) return res.status(404).json({ error: 'Category not found' });

        const oldName = category.name;
        
        // 1. Check if name is being changed to something else that already exists
        if (name && name !== oldName) {
            const conflict = await prisma.category.findUnique({ where: { name } });
            if (conflict) return res.status(400).json({ error: 'Another category is already using that name' });
        }

        const newName = name || oldName;

        // 2. Perform Cascade Rename if name changed
        if (newName !== oldName) {
            console.log(`Cascading category rename from "${oldName}" to "${newName}"`);
            
            await prisma.serviceCatalog.updateMany({
                where: { category: oldName },
                data: { category: newName }
            });

            const partnersToUpdate = await prisma.partnerProfile.findMany({
                where: { categories: { has: oldName } },
                select: { id: true, categories: true }
            });

            for (const partner of partnersToUpdate) {
                const updatedCategories = [...new Set(partner.categories.map(c => c === oldName ? newName : c))];
                await prisma.partnerProfile.update({
                    where: { id: partner.id },
                    data: { categories: updatedCategories }
                });
            }
        }

        // 3. Update Category Row
        const updated = await prisma.category.update({
            where: { id },
            data: {
                name: newName,
                image: image !== undefined ? image : category.image,
                description: description !== undefined ? description : category.description,
                isActive: isActive !== undefined ? isActive : category.isActive
            }
        });

        res.json(mapCategoryContent(updated));
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) return res.status(404).json({ error: 'Category not found' });

        // Check for dependencies
        const servicesUsingIt = await prisma.serviceCatalog.count({
            where: { category: category.name }
        });

        if (servicesUsingIt > 0) {
            return res.status(400).json({ 
                error: `Cannot delete category: ${servicesUsingIt} services belong to it. Move or delete them first.` 
            });
        }

        // Clean up Cloudinary asset
        if (category.image) {
            try {
                const publicId = getPublicId(CloudinaryResourceType.CATEGORY_THUMBNAIL, id);
                await deleteAsset(publicId);
            } catch (ignore) { console.log('Asset missing or delete failed', ignore.message); }
        }

        await prisma.category.delete({ where: { id } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
};
