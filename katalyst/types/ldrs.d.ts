declare namespace JSX {
  interface IntrinsicElements {
    'l-bouncy': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        size?: string | number;
        speed?: string | number;
        color?: string;
      },
      HTMLElement
    >;
  }
}

// Optional: If you want to extend the global Window interface
declare global {
  namespace React {
    interface HTMLAttributes<T> {
      size?: string | number;
      speed?: string | number;
      color?: string;
    }
  }
}
