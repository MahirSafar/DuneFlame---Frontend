"use client"

export default function StoryBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="glass rounded-3xl p-12 md:p-16 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-primary dark:text-secondary mb-6 leading-tight">
            From Bean to Cup
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8 leading-relaxed">
            Every cup of DuneFlame coffee tells a story. From the volcanic soils of Ethiopia to the highlands of
            Colombia, we source only the finest beans from sustainable farms. Our small-batch roasting process preserves
            the unique character of each origin, creating an experience that's as warm as the Sahara sunrise.
          </p>
          <button className="px-8 py-3 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg transition-smooth">
            Learn Our Story
          </button>
        </div>
      </div>
    </section>
  )
}
