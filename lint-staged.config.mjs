export default {
    '*.{mjs,cjs,js,jsx,ts,tsx}': ['prettier --write', 'pnpm run lint'],
    '*.{css,scss,html,json,md}': ['prettier --write'],
};
