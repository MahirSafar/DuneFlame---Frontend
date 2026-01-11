"use client"

import { useState } from "react"
import { Plus, Trash2, Edit2, Search } from "lucide-react"

const products = [
  {
    id: 1,
    name: "Sunrise Espresso",
    category: "Beans",
    price: 18.99,
    stock: 245,
    status: "In Stock",
    image: "☕",
  },
  {
    id: 2,
    name: "Mountain Peak Brew",
    category: "Beans",
    price: 22.99,
    stock: 0,
    status: "Out of Stock",
    image: "🏔️",
  },
  {
    id: 3,
    name: "Premium Espresso Capsules",
    category: "Capsules",
    price: 12.99,
    stock: 45,
    status: "In Stock",
    image: "💊",
  },
  {
    id: 4,
    name: "Volcanic Roast",
    category: "Beans",
    price: 25.99,
    stock: 8,
    status: "Low Stock",
    image: "🌋",
  },
  {
    id: 5,
    name: "Coffee Grinder Pro",
    category: "Equipment",
    price: 149.99,
    stock: 12,
    status: "In Stock",
    image: "⚙️",
  },
]

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<(typeof products)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const openAddModal = () => {
    setSelectedProduct(null)
    setIsEditMode(false)
    setIsModalOpen(true)
  }

  const openEditModal = (product: (typeof products)[0]) => {
    setSelectedProduct(product)
    setIsEditMode(true)
    setIsModalOpen(true)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">Products Management</h1>
          <p className="text-muted-foreground">Manage your coffee products and inventory</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-semibold hover:shadow-lg transition-smooth"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Search and Filter */}
      <div className="glass rounded-lg p-4">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 pl-12 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="glass rounded-xl overflow-hidden card-depth">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-accent/5">
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Product</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Category</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Price</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Stock</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-accent/5 transition-smooth group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{product.image}</div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-foreground font-semibold">${product.price}</td>
                  <td className="py-4 px-6">
                    <span className="font-medium text-foreground">{product.stock} units</span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.status === "In Stock"
                          ? "bg-green-500/20 text-green-700 dark:text-green-400"
                          : product.status === "Low Stock"
                            ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                            : "bg-red-500/20 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 hover:bg-accent/20 rounded-lg transition-smooth text-accent"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-red-500/20 rounded-lg transition-smooth text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-dark dark:glass rounded-2xl p-8 max-w-2xl w-full card-depth animate-in zoom-in">
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-6">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Product Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Sunrise Espresso"
                    defaultValue={selectedProduct?.name}
                    className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <select className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                    <option>Beans</option>
                    <option>Capsules</option>
                    <option>Equipment</option>
                    <option>Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Price</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    defaultValue={selectedProduct?.price}
                    className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    placeholder="0"
                    defaultValue={selectedProduct?.stock}
                    className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  placeholder="Product description..."
                  rows={3}
                  className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="flex items-center gap-4 pt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent/5 transition-smooth font-medium"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-medium hover:shadow-lg transition-smooth">
                  {isEditMode ? "Update Product" : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
