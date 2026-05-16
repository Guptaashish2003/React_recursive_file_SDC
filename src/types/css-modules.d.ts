// src/types/css-modules.d.ts

// Declare CSS modules for side-effect imports (global CSS)
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Alternative: For CSS Modules (if you use .module.css files)
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// For SCSS/SASS files (if you use them)
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}