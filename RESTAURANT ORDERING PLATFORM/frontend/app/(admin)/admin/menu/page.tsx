'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import { MenuItem, Category } from '@/types';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/kitchen/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/providers';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type MenuFormState = {
  name: string;
  categoryId: string;
  description: string;
  price: string;
  isVeg: boolean;
  spiceLevel: string;
  preparationTime: string;
  imageUrl: string;
  isAvailable: boolean;
};

const EMPTY_FORM: MenuFormState = {
  name: '',
  categoryId: '',
  description: '',
  price: '',
  isVeg: false,
  spiceLevel: 'MILD',
  preparationTime: '15',
  imageUrl: '',
  isAvailable: true,
};

export default function AdminMenuPage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Item dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Category add
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    const user = getUser();
    if (user && user.role !== 'ADMIN') { router.push('/'); return; }
    fetchData();
  }, [router]);

  async function fetchData() {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        api.get('/api/menu/items'),
        api.get('/api/menu/categories'),
      ]);
      setItems(itemsRes.data.data ?? itemsRes.data ?? []);
      setCategories(catsRes.data.data ?? catsRes.data ?? []);
    } catch {
      toast('Failed to load menu data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name ?? '',
      categoryId: String(item.categoryId ?? ''),
      description: item.description ?? '',
      price: String(item.price ?? 0),
      isVeg: Boolean(item.isVeg),
      spiceLevel: String(item.spiceLevel ?? 'MILD'),
      preparationTime: String(item.preparationTime ?? 15),
      imageUrl: item.imageUrl ?? '',
      isAvailable: Boolean(item.isAvailable),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.categoryId) {
      toast('Name, price and category are required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      preparationTime: Number(form.preparationTime),
    };
    try {
      if (editingId) {
        await api.put(`/api/menu/items/${editingId}`, payload);
        toast('Item updated', 'success');
      } else {
        await api.post('/api/menu/items', payload);
        toast('Item created', 'success');
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      toast('Failed to save item', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/api/menu/items/${deleteId}`);
      toast('Item deleted', 'success');
      setDeleteId(null);
      fetchData();
    } catch {
      toast('Failed to delete item', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      await api.post('/api/menu/categories', { name: newCatName.trim() });
      toast('Category added', 'success');
      setNewCatName('');
      fetchData();
    } catch {
      toast('Failed to add category', 'error');
    } finally {
      setAddingCat(false);
    }
  }

  const columns: Column<MenuItem>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'category',
      header: 'Category',
      render: (i) => i.category?.name ?? categories.find((c) => c.id === i.categoryId)?.name ?? '—',
    },
    { key: 'price', header: 'Price', render: (i) => formatCurrency(i.price) },
    {
      key: 'isVeg',
      header: 'Type',
      render: (i) => (
        <span className={`text-xs font-medium ${i.isVeg ? 'text-green-600' : 'text-red-600'}`}>
          {i.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
        </span>
      ),
    },
    {
      key: 'isAvailable',
      header: 'Status',
      render: (i) => (
        <StatusBadge status={i.isAvailable ? 'AVAILABLE' : 'CANCELLED'} size="sm" />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (i) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(i)}
            className="text-blue-600 hover:text-blue-700 p-1"
            aria-label="Edit item"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(i.id)}
            className="text-red-600 hover:text-red-700 p-1"
            aria-label="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Menu Management</h1>
        <Button variant="primary" onClick={openAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {/* Items Table */}
      <DataTable columns={columns} data={items} loading={loading} />

      {/* Categories section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-text mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="bg-surface-muted text-text text-sm px-3 py-1 rounded-full border border-surface-border"
            >
              {cat.name}
            </span>
          ))}
        </div>
        <div className="flex gap-3 max-w-sm">
          <Input
            placeholder="New category name"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={handleAddCategory}
            disabled={addingCat || !newCatName.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <FormField label="Name *">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Paneer Tikka"
              />
            </FormField>

            <FormField label="Category *">
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Select category…</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </FormField>

            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the dish…"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Price (₹) *">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </FormField>
              <FormField label="Prep Time (min)">
                <Input
                  type="number"
                  min={0}
                  value={form.preparationTime}
                  onChange={(e) => setForm((f) => ({ ...f, preparationTime: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Spice Level">
                <Select
                  value={form.spiceLevel}
                  onChange={(e) => setForm((f) => ({ ...f, spiceLevel: e.target.value }))}
                >
                  <option value="MILD">Mild</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HOT">Hot</option>
                </Select>
              </FormField>
              <div className="flex flex-col gap-1 justify-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={(e) => setForm((f) => ({ ...f, isVeg: e.target.checked }))}
                    className="rounded"
                  />
                  Vegetarian
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                    className="rounded"
                  />
                  Available
                </label>
              </div>
            </div>

            <FormField label="Image URL">
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://…"
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-text-muted mb-4">
            Are you sure you want to delete this menu item? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
