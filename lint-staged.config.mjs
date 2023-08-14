export default {
    '*.{mjs,cjs,js,jsx,ts,tsx}': ['prettier --write', 'npm run lint'],
    '*.{css,scss,html,json,md,mdx,yaml,yml}': ['prettier --write'],
};
