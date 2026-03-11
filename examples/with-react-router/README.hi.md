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

# with-react-router

`@tuvix.js/router` द्वारा संचालित **URL-आधारित माइक्रो ऐप रूटिंग** को प्रदर्शित करता है। तीन स्वतंत्र React माइक्रो ऐप्स - Dashboard, Profile और Settings - विशिष्ट रूटों पर पंजीकृत होती हैं और उपयोगकर्ता के नेविगेट करने पर स्वचालित रूप से माउंट/अनमाउंट होती हैं।

## उपयोग किए गए पैकेज

| पैकेज | भूमिका |
|---|---|
| `@tuvix.js/core` | Shell Orchestrator (राउटर इंजन एम्बेड करता है) |
| `@tuvix.js/router` | History/Hash मोड रूटिंग |
| `@tuvix.js/react` | `createReactMicroApp` फ़ैक्टरी |

## अंदर क्या है

```
with-react-router/
├── index.html          ← सक्रिय-लिंक हाइलाइट के साथ नेव बार
├── vite.config.ts
├── src/
│   ├── shell.ts        ← 3 रूट पंजीकृत करता है, सक्रिय nav क्लास सिंक करता है
│   └── apps/
│       ├── dashboard/  ← /dashboard पर सक्रिय
│       ├── profile/    ← /profile पर सक्रिय
│       └── settings/   ← /settings पर सक्रिय
```

## शुरू करें

### npx के माध्यम से (अनुशंसित)

```bash
npx create-tuvix-app@latest --example with-react-router mera-app
cd mera-app
npm install
npm run dev
```

### मैन्युअल क्लोन

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

[http://localhost:5173/dashboard](http://localhost:5173/dashboard) खोलें और नेव लिंक का उपयोग करें।

## मुख्य अवधारणाएं

- **रूट मिलान** - प्रत्येक `activeWhen` पैटर्न को `window.location.pathname` के विरुद्ध मिलाया जाता है। Glob पैटर्न (`/dashboard/*`) माइक्रो ऐप्स को अपने स्वयं के सब-रूट नियंत्रित करने देते हैं।
- **History मोड** - `#` के बिना क्लीन URLs के लिए HTML5 History API का उपयोग करता है।
- **शून्य बंडल दोहराव** - किसी भी समय केवल सक्रिय माइक्रो ऐप का कोड चलता है।
