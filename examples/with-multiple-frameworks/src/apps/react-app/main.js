import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createReactMicroApp } from '@tuvix.js/react';
function ReactApp() {
    return (_jsxs("div", { style: { padding: '24px', background: '#30475e', borderRadius: '12px' }, children: [_jsx("h2", { style: { margin: '0 0 16px', color: '#61dafb' }, children: "\u269B\uFE0F React Micro App" }), _jsxs("p", { style: { color: '#e0e0e0', lineHeight: 1.6 }, children: ["I'm a standard React component wrapped in ", _jsx("code", { children: "createReactMicroApp" }), "."] })] }));
}
export default createReactMicroApp({ name: 'react-app', App: ReactApp });
//# sourceMappingURL=main.js.map