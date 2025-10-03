# Guide Popup Customization Guide

Quick reference for customizing popup content and behavior.

## 🎨 Change Content

### **Update Stats**

Edit in `GuideSubscriptionPopup.tsx` (line ~60):

```typescript
const stats = [
  { icon: Users, value: "500+", label: "Viajantes satisfeitos" },
  { icon: Star, value: "4.9", label: "Avaliação média" },
  { icon: TrendingUp, value: "95%", label: "Taxa de sucesso" },
];
```

### **Update Benefits**

Edit in `GuideSubscriptionPopup.tsx` (line ~65):

```typescript
const benefits = [
  {
    icon: Map,
    title: "Roteiros Dia a Dia",
    description: "Planejamento completo com horários otimizados",
    gradient: "from-blue-500 to-cyan-500"
  },
  // Add more benefits...
];
```

### **Update Testimonials**

Edit in `GuideSubscriptionPopup.tsx` (line ~95):

```typescript
const socialProof = [
  {
    name: "Marina S.",
    text: "Economizei dias de pesquisa! O guia é completo.",
    rating: 5
  },
  // Add more testimonials...
];
```

### **Update Price**

Edit in `GuideSubscriptionPopup.tsx` (line ~270):

```tsx
<span className="text-6xl font-bold text-white">R$ 99</span>
```

And in `GuidePopupMobile.tsx` (line ~150):

```tsx
<span className="text-5xl font-bold">R$ 99</span>
```

### **Update Features List**

Edit in `GuideSubscriptionPopup.tsx` (line ~280):

```typescript
{[
  "✨ Guia completo atualizado 2025",
  "🗺️ Roteiros dia a dia detalhados",
  // Add more features...
].map((feature, idx) => (...))}
```

## ⚙️ Change Behavior

### **Timing**

```typescript
// Delay before showing (GuidePopupManager.tsx, line ~70)
setTimeout(() => {
  setShowPopup(true);
}, 3000); // Change 3000 to desired milliseconds

// Dismissal cooldown (GuidePopupManager.tsx, line ~17)
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // Change days
```

### **Mobile Breakpoint**

```typescript
// GuidePopupManager.tsx, line ~34
setIsMobile(window.innerWidth < 768); // Change 768 to desired px
```

## 🎨 Change Colors

### **Gradient Backgrounds**

Replace color classes throughout files:

- `from-blue-600 to-cyan-500` → Primary gradient
- `from-purple-500 to-pink-500` → Secondary
- `from-orange-500 to-red-500` → Accent
- `from-green-500 to-emerald-500` → Success

### **CTA Button**

```tsx
// Desktop (GuideSubscriptionPopup.tsx, line ~300)
<Button className="bg-white text-blue-600 hover:bg-blue-50">

// Mobile (GuidePopupMobile.tsx, line ~170)
<Button className="bg-white text-blue-600 hover:bg-blue-50">
```

## 📏 Change Layout

### **Desktop Split Ratio**

```tsx
// GuideSubscriptionPopup.tsx, line ~145
<div className="grid lg:grid-cols-[1.2fr,1fr]">
// Change ratio: [1.2fr,1fr] → [1fr,1fr] for 50/50
// Or [1.5fr,1fr] for more content space
```

### **Max Width**

```tsx
// GuideSubscriptionPopup.tsx, line ~115
<DialogContent className="max-w-6xl">
// Change max-w-6xl to: max-w-4xl, max-w-5xl, max-w-7xl
```

## 🔧 Advanced Customization

### **Add New Tab**

1. Update tab type (line ~50):
```typescript
const [activeTab, setActiveTab] = useState<"benefits" | "content" | "social" | "newTab">("benefits");
```

2. Add tab button (line ~230):
```tsx
<button onClick={() => setActiveTab("newTab")}>
  New Tab
</button>
```

3. Add tab content (line ~250):
```tsx
{activeTab === "newTab" && (
  <motion.div>
    {/* Your content */}
  </motion.div>
)}
```

### **Change Animation Speed**

```tsx
// Framer Motion transitions (various lines)
transition={{ duration: 0.5 }} // Change 0.5 to desired seconds
```

### **Disable Animations**

Remove Framer Motion components and replace with regular divs:

```tsx
// Before
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

// After
<div>
```

## 🧪 Testing After Changes

1. Clear storage:
```javascript
window.testGuidePopup.reset()
```

2. Refresh home page

3. Or use admin panel: `/admin/dashboard/test-popup`

## ⚠️ Important Notes

- Always test on both mobile and desktop
- Keep content concise for mobile screens
- Maintain color contrast for accessibility
- Test CTA button placement and size
- Verify popup doesn't break on resize

## 📚 Related Files

- `GuideSubscriptionPopup.tsx` - Desktop version
- `GuidePopupMobile.tsx` - Mobile version
- `GuidePopupManager.tsx` - Display logic
- `/app/(protected)/meu-painel/guia/assinar/page.tsx` - Subscription page
