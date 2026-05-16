# 📦 Storebox File Explorer

A modern, VS Code-inspired file management system built with React, TypeScript, and localStorage persistence.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18+-61dafb?logo=react)
![localStorage](https://img.shields.io/badge/Persistence-localStorage-orange)
<img width="2256" height="1377" alt="image" src="https://github.com/user-attachments/assets/7d6e1cb3-78c2-426b-9080-ce599bcc01a1" />

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Architecture](#-architecture)
- [Dashboard Preview](#-dashboard-preview)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Build & Deploy](#-build--deploy)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## ✨ Features

### Core Functionality

- ✅ **Create Files & Folders** - Right-click context menu or toolbar buttons
- ✅ **Rename** - Double-click or F2 shortcut with inline editing
- ✅ **Delete** - Right-click menu or Delete key with confirmation
- ✅ **Drag & Drop** - Move files/folders between directories
- ✅ **Nested Structure** - Unlimited folder nesting support
- ✅ **File Content Editing** - Built-in text editor with syntax awareness
- ✅ **Search** - Real-time file/folder search with highlighting
- ✅ **Context Menu** - VS Code-style right-click menu

### User Experience

- 🎨 **Dark/Light Theme** - Toggle between themes with persistent preference
- 💾 **Auto-Save** - All changes persist in browser localStorage
- ⌨️ **Keyboard Navigation** - Full keyboard shortcut support
- 📱 **Responsive Design** - Works on desktop and tablet devices
- ♿ **Accessibility** - ARIA labels, keyboard navigation, screen reader support
- 🎯 **Smart Selection** - Click to select, double-click to open/rename

### Advanced Features

- 🔍 **Fuzzy Search** - Find files by name with instant results
- 📊 **Status Bar** - Real-time file/folder count and selection info
- 📝 **File Editor** - Syntax-aware text editing with line numbers
- 🔐 **Data Persistence** - All data stored locally in browser
- 🎭 **File Icons** - Visual indicators for different file types
- 📂 **Breadcrumb Navigation** - Clear folder hierarchy visualization

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18+ | UI Component Library |
| **TypeScript** | 5.0+ | Type Safety |
| **CSS Modules** | - | Scoped Styling |
| **Lucide React** | Latest | Icon Library |
| **localStorage API** | - | Data Persistence |
| **Vite** | Latest | Build Tool |

---

## 📥 Installation

### Prerequisites

- Node.js 16+ and npm/yarn installed
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd filemanagement

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:5173 (Vite) or http://localhost:3000 (CRA)
```

---

## 🎮 Usage

### Creating Files & Folders

**Method 1: Context Menu**
1. Right-click on any folder or empty space
2. Select "New File" or "New Folder"
3. Type the name and press Enter

**Method 2: Toolbar Buttons**
1. Click "New File" or "New Folder" button in the explorer header
2. Type the name and press Enter

### Editing Files

1. Double-click any file to open in editor
2. Make your changes
3. Press `Ctrl/Cmd + S` or click Save button
4. Auto-saves on blur (when you click away)

### Organizing Files

- **Drag & Drop**: Drag any file/folder onto another folder to move it
- **Expand/Collapse**: Click folder arrow or press `→` / `←`

---

## ⌨️ Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open search bar |
| `F1` | Show keyboard shortcuts help |
| `F2` | Rename selected item |
| `Delete` | Delete selected item |
| `Ctrl/Cmd + N` | Create new file |
| `Ctrl/Cmd + Shift + N` | Create new folder |
| `Ctrl/Cmd + B` | Toggle sidebar (future) |
| `Escape` | Close dialogs / Cancel operation |

### File Explorer Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate up/down in file list |
| `→` | Expand folder / Open file |
| `←` | Collapse folder |
| `Enter` | Open file / Expand folder |
| `F2` | Rename selected item |

### File Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save file |
| `Escape` | Close editor (if no unsaved changes) |

### Context Menu

| Key | Action |
|-----|--------|
| `Right Click` | Open context menu |
| `↑` / `↓` | Navigate menu items |
| `Enter` | Select menu item |
| `Escape` | Close menu |

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    React Application                   │  │
│  │                                                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   App.tsx   │  │  FileEditor │  │   SearchBar │  │  │
│  │  │  (Provider) │  │  Component  │  │  Component  │  │  │
│  │  └──────┬──────┘  └─────────────┘  └─────────────┘  │  │
│  │         │                                             │  │
│  │  ┌──────▼──────────────────────────────────────┐    │  │
│  │  │         FileSystemContext                   │    │  │
│  │  │  - State Management (useReducer)            │    │  │
│  │  │  - Actions: Create, Read, Update, Delete    │    │  │
│  │  │  - localStorage Sync (useEffect)            │    │  │
│  │  └──────────────┬──────────────────────────────┘    │  │
│  │                 │                                    │  │
│  │  ┌──────────────▼──────────────────────────────┐    │  │
│  │  │            FileExplorer                      │    │  │
│  │  │  - TreeNode (Recursive)                     │    │  │
│  │  │  - ContextMenu                              │    │  │
│  │  │  - Drag & Drop                              │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   localStorage                        │  │
│  │  Key: "storebox-fs-v1"                               │  │
│  │  Data: { nodes, expandedIds, selectedId, ... }       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Action
    ↓
Event Handler (onClick, onKeyDown, onDrop)
    ↓
Context Action Dispatcher
    ↓
Reducer (Pure Function)
    ↓
New State
    ↓
localStorage Persistence (useEffect)
    ↓
UI Re-render
```

### Component Hierarchy

```
App
├── ThemeProvider
│   └── FileSystemProvider
│       ├── Header
│       │   ├── SearchBar
│       │   └── ThemeToggle
│       ├── Main Content
│       │   ├── FileExplorer
│       │   │   ├── CreateButtons
│       │   │   ├── TreeNode (recursive)
│       │   │   │   └── InlineRename
│       │   │   └── ContextMenu
│       │   └── FileEditor
│       │       └── TextArea
│       └── StatusBar
```

---

## 🖼️ Dashboard Preview

### Application Layout

```
┌────────────────────────────────────────────────────────────────┐
│  📦 Storebox Explorer          [Search files... ⌘K]  🌙 ⚙️    │
├──────────────────┬─────────────────────────────────────────────┤
│                  │                                             │
│  EXPLORER        │  README.md                                  │
│                  │  ─────────────────────────────────────────  │
│  [+] New File    │  # Welcome to Storebox                      │
│  [+] New Folder  │                                             │
│                  │  This is a powerful file management         │
│  ▼ workspace     │  system with features like:                 │
│    📁 Projects   │                                             │
│    📁 Documents  │  • Create, edit, delete files               │
│      📄 file1.txt│  • Organize with folders                    │
│      📄 file2.md │  • Search functionality                     │
│    📄 README.md  │  • Keyboard shortcuts                       │
│    📄 notes.txt  │                                             │
│                  │  Press F1 for keyboard shortcuts.           │
│                  │                                             │
├──────────────────┴─────────────────────────────────────────────┤
│  Selected: README.md (file)    5 items    •    Storebox v1.0   │
└────────────────────────────────────────────────────────────────┘
```

### Key UI Components

**1. Header Bar**
- Logo and app title
- Global search bar with `⌘K` shortcut
- Theme toggle (light/dark)
- Settings/help icon

**2. Sidebar (Explorer)**
- Create buttons for new files/folders
- Tree view with expandable folders
- File/folder icons with visual indicators
- Context menu on right-click
- Drag handles for reordering

**3. Main Editor Area**
- Tab with filename
- Syntax-highlighted text area
- Save indicator (● when dirty)
- Line numbers (for code files)
- Auto-save on blur

**4. Status Bar**
- Currently selected item info
- Total item count
- App version
- File type indicator

---

## 📁 Project Structure

```
filemanagement/
├── public/
│   └── index.html
├── src/
│   ├── _hooks/
│   │   ├── useContextMenu.ts      # Context menu hook
│   │   └── useKeyboard.ts         # Keyboard shortcuts hook
│   ├── components/
│   │   ├── FileExplorer/
│   │   │   ├── FileExplorer.tsx   # Main explorer component
│   │   │   ├── FileExplorer.module.css
│   │   │   ├── TreeNode.tsx       # Recursive tree node
│   │   │   ├── TreeNode.module.css
│   │   │   ├── CreateButtons.tsx  # New file/folder buttons
│   │   │   ├── CreateButtons.module.css
│   │   │   ├── ContextMenu.tsx    # Right-click menu
│   │   │   ├── ContextMenu.module.css
│   │   │   └── InlineRename.tsx   # Inline rename input
│   │   │       └── InlineRename.module.css
│   │   ├── FileEditor/
│   │   │   ├── FileEditor.tsx     # Text editor component
│   │   │   └── FileEditor.module.css
│   │   └── Search/
│   │       ├── SearchBar.tsx      # Search component
│   │       └── SearchBar.module.css
│   ├── context/
│   │   ├── FileSystemContext.tsx  # Main state management
│   │   └── ThemeContext.tsx       # Theme toggle context
│   ├── lib/
│   │   ├── fsReducer.ts           # File system reducer
│   │   └── fsUtils.ts             # Utility functions
│   ├── types/
│   │   ├── fs.ts                  # TypeScript types
│   │   └── css-modules.d.ts       # CSS module types
│   ├── utils/
│   │   └── fsUtils.ts             # Helper functions
│   ├── App.tsx                    # Root component
│   ├── App.css                    # Global styles
│   ├── index.tsx                  # Entry point
│   ├── index.css                  # Base styles
│   └── logo.svg
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🧪 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (if configured)
npm test
```

### Debugging

**Browser DevTools:**
- Console: Check for errors and warnings
- Application → Local Storage: View persisted data
- React DevTools: Inspect component tree and state
- Network: Monitor localStorage operations

**Common Issues:**
1. **Data not persisting**: Check browser console for localStorage quota errors
2. **Type errors**: Run `npx tsc --noEmit` to check TypeScript
3. **Stale data**: Clear localStorage: `localStorage.clear()`

---

## 🚀 Build & Deploy

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

```bash
npm run build
npm install -g gh-pages
gh-pages -d dist
```

---

## 🔮 Future Enhancements

### Planned Features

- ☁️ **Cloud Sync** - Integrate with backend API for cloud storage
- 📤 **File Upload/Download** - Import/export files
- 🔎 **Advanced Search** - Regex, filters, date range
- 👁️ **File Preview** - Image, PDF, document preview
- 👥 **Collaborative Editing** - Real-time multi-user editing
- 🕒 **Version History** - Track file changes over time
- 🗑️ **Trash/Recycle Bin** - Soft delete with restore
- ⭐ **Favorites/Bookmarks** - Quick access to important files
- 🎨 **Custom Themes** - User-defined color schemes
- 🔌 **Plugin System** - Extend functionality with plugins
- ⌨️ **Keyboard Macros** - Record and replay actions
- 📦 **Export/Import** - Backup and restore file structure

### Performance Improvements

- Virtual scrolling for large file lists
- Lazy loading of folder contents
- Debounced search for better performance
- IndexedDB for larger storage capacity
- Service Worker for offline support

---

## 📄 License

MIT License — feel free to use this project for learning and commercial purposes.

```
Copyright (c) 2024 Storebox File Explorer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Author

Storebox Frontend Engineer Assignment  
Built with ❤️ using React, TypeScript, and modern web technologies.

## 📞 Support

For issues, questions, or contributions:
- **Email**: hello@mail.storebox.ai
- **GitHub Issues**: Create an issue

---

Happy File Managing! 🎉
