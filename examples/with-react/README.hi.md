<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

# with-react

**React 18** और **Vite** के साथ निर्मित एक पूर्ण माइक्रो-फ्रंटेंड शेल, जो दर्शाता है कि Tuvix.js Orchestrator स्वतंत्र React माइक्रो ऐप्स को कैसे load, mount और unmount करता है।

## उपयोग किए गए पैकेज

| पैकेज | भूमिका |
|---|---|
| `@tuvix.js/core` | Shell Orchestrator |
| `@tuvix.js/react` | `createReactMicroApp` फ़ैक्टरी |
| `@tuvix.js/event-bus` | साझा इवेंट बस |

## शुरू करें

### npx के माध्यम से (अनुशंसित)

```bash
npx create-tuvix-app@latest --example with-react my-app
cd my-app
npm install
npm run dev
```

### मैन्युअल क्लोन

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

[http://localhost:5173/home](http://localhost:5173/home) खोलें।

## मुख्य अवधारणाएं

- **`createReactMicroApp`** - एक React कम्पोनेंट को `bootstrap`, `mount`, `unmount` और `update` हुक के साथ Tuvix.js-संगत मॉड्यूल में लपेटता है।
- **Props पासिंग** - शेल `{ theme, user }` props `home` ऐप को भेजता है।
- **लाइफसाइकल** - प्रत्येक ऐप केवल तब माउंट होती है जब उसका रूट सक्रिय हो।
