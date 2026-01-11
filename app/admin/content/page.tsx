"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, GripVertical } from "lucide-react"

const sliders = [
  {
    id: 1,
    title: "Summer Collection Launch",
    image: "☀️",
    order: 1,
    active: true,
  },
  {
    id: 2,
    title: "Premium Beans Sale",
    image: "🎁",
    order: 2,
    active: true,
  },
  {
    id: 3,
    title: "New Equipment Showcase",
    image: "⚙️",
    order: 3,
    active: false,
  },
]

const aboutSections = [
  {
    id: 1,
    title: "Our Story",
    content: "Founded in 2015, DuneFlame has been bringing premium coffee to enthusiasts worldwide...",
  },
  {
    id: 2,
    title: "Our Mission",
    content: "We believe in sustainable sourcing and ethical farming practices...",
  },
  {
    id: 3,
    title: "Our Values",
    content: "Quality, sustainability, and community are at the heart of everything we do...",
  },
]

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState("sliders")
  const [selectedSlider, setSelectedSlider] = useState<(typeof sliders)[0] | null>(null)
  const [isSliderModalOpen, setIsSliderModalOpen] = useState(false)
  const [selectedAbout, setSelectedAbout] = useState<(typeof aboutSections)[0] | null>(null)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary dark:text-secondary mb-2">Content Management</h1>
        <p className="text-muted-foreground">Manage homepage sliders and about page content</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab("sliders")}
          className={`px-6 py-3 font-medium transition-smooth border-b-2 ${
            activeTab === "sliders"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Homepage Sliders
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`px-6 py-3 font-medium transition-smooth border-b-2 ${
            activeTab === "about"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          About Page
        </button>
      </div>

      {/* Sliders Tab */}
      {activeTab === "sliders" && (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedSlider(null)
              setIsSliderModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-semibold hover:shadow-lg transition-smooth"
          >
            <Plus size={20} />
            Add Slider
          </button>

          <div className="space-y-3">
            {sliders.map((slider) => (
              <div
                key={slider.id}
                className="glass rounded-xl p-4 flex items-center gap-4 card-depth hover:glow-warm transition-smooth group"
              >
                <GripVertical size={20} className="text-muted-foreground cursor-move" />
                <div className="text-4xl">{slider.image}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{slider.title}</h3>
                  <p className="text-sm text-muted-foreground">Order: {slider.order}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${slider.active ? "bg-green-500" : "bg-gray-500"}`} />
                  <span className="text-xs text-muted-foreground">{slider.active ? "Active" : "Inactive"}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
                  <button
                    onClick={() => {
                      setSelectedSlider(slider)
                      setIsSliderModalOpen(true)
                    }}
                    className="p-2 hover:bg-accent/20 rounded-lg transition-smooth text-accent"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button className="p-2 hover:bg-red-500/20 rounded-lg transition-smooth text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Tab */}
      {activeTab === "about" && (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedAbout(null)
              setIsAboutModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-semibold hover:shadow-lg transition-smooth"
          >
            <Plus size={20} />
            Add Section
          </button>

          <div className="space-y-3">
            {aboutSections.map((section) => (
              <div key={section.id} className="glass rounded-xl p-6 card-depth hover:glow-warm transition-smooth group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-smooth">
                    <button
                      onClick={() => {
                        setSelectedAbout(section)
                        setIsAboutModalOpen(true)
                      }}
                      className="p-2 hover:bg-accent/20 rounded-lg transition-smooth text-accent"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 hover:bg-red-500/20 rounded-lg transition-smooth text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slider Modal */}
      {isSliderModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-dark dark:glass rounded-2xl p-8 max-w-2xl w-full card-depth animate-in zoom-in">
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-6">
              {selectedSlider ? "Edit Slider" : "Add New Slider"}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                <input
                  type="text"
                  defaultValue={selectedSlider?.title}
                  placeholder="Slider title"
                  className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Order</label>
                <input
                  type="number"
                  defaultValue={selectedSlider?.order}
                  placeholder="1"
                  className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked={selectedSlider?.active} className="w-4 h-4 accent-accent" />
                  <span className="text-foreground font-medium">Active</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsSliderModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent/5 transition-smooth font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsSliderModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-medium hover:shadow-lg transition-smooth"
              >
                Save Slider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-dark dark:glass rounded-2xl p-8 max-w-2xl w-full card-depth animate-in zoom-in">
            <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-6">
              {selectedAbout ? "Edit Section" : "Add New Section"}
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Section Title</label>
                <input
                  type="text"
                  defaultValue={selectedAbout?.title}
                  placeholder="e.g., Our Story"
                  className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                <textarea
                  defaultValue={selectedAbout?.content}
                  placeholder="Section content..."
                  rows={6}
                  className="w-full bg-white/50 dark:bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent/5 transition-smooth font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gradient-warm-btn text-accent-foreground rounded-lg font-medium hover:shadow-lg transition-smooth"
              >
                Save Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
