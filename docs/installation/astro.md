# Astro Guide

## As a script tag

Add the script tag to your root layout

```astro
<!doctype html>
<html lang="en">
  <head>
    <script is:inline src="https://unpkg.com/react-scan/dist/auto.global.js" />

    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

## As a module import

Add the script to your root layout

```astro
<!doctype html>
<html lang="en">
  <head>
    <script>
      import { scan } from 'react-scan';

      scan({
        enabled: true,
      });
    </script>
    <!-- rest of your scripts go under -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```
