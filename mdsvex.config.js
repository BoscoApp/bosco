import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { defineMDSveXConfig as defineConfig } from 'mdsvex';

// mdsvex reads the layout file from disk itself (readFileSync) and injects it as an import, so the
// path must be a REAL filesystem path — it does not resolve Vite aliases like `$lib`, and a plain
// relative path resolves against each .md's own directory. An absolute path (forward slashes, which
// Node accepts on Windows) satisfies both the readFileSync and the bundler import.
const here = dirname(fileURLToPath(import.meta.url));
const layout = join(here, 'src', 'lib', 'content', 'mdsvex-layout.svelte').replace(/\\/g, '/');

const config = defineConfig({
	extensions: ['.svx', '.md'],
	layout: { _: layout }
});

export default config;
