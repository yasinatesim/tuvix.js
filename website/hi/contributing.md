# Tuvix.js में योगदान

योगदान में रुचि दिखाने के लिए धन्यवाद! चाहे बग फिक्स हो, नई सुविधा हो, दस्तावेज़ीकरण में सुधार हो, या अनुवाद - सभी योगदानों का स्वागत है।

## योगदान के तरीके

- **बग रिपोर्ट** - [Issue बनाएं](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **सुविधा अनुरोध** - [चर्चा शुरू करें](https://github.com/yasinatesim/tuvix.js/issues)
- **कोड** - बग ठीक करें, सुविधाएं जोड़ें, परीक्षण सुधारें
- **दस्तावेज़ीकरण** - टाइपो ठीक करें, उदाहरण जोड़ें, स्पष्टता में सुधार करें
- **अनुवाद** - अन्य भाषाओं में दस्तावेज़ीकरण जोड़ें या सुधारें

## शुरू करना

### 1. Fork और Clone

```bash
git clone https://github.com/YOUR_USERNAME/tuvix.js.git
cd tuvix.js
```

### 2. Dependencies इंस्टॉल करें

हम [pnpm](https://pnpm.io) और [Node.js ≥ 18](https://nodejs.org) का उपयोग करते हैं।

```bash
pnpm install
```

### 3. सभी पैकेज बिल्ड करें

```bash
pnpm build
```

### 4. परीक्षण चलाएं

```bash
pnpm test
```

### 5. दस्तावेज़ीकरण विकास सर्वर शुरू करें

```bash
cd website
pnpm install
pnpm dev
```

दस्तावेज़ीकरण का पूर्वावलोकन करने के लिए अपने ब्राउज़र में `http://localhost:5173` खोलें।

## प्रोजेक्ट संरचना

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     VitePress कॉन्फ़िगरेशन और थीम
    ├── guide/          अंग्रेज़ी दस्तावेज़ीकरण
    ├── packages/       पैकेज API दस्तावेज़ीकरण
    ├── tr/             तुर्की अनुवाद
    ├── es/             स्पेनिश अनुवाद
    └── ...             अन्य भाषाएं
```

## कोड शैली

- **TypeScript** - strict मोड, सभी कोड टाइप्ड होना चाहिए
- **Prettier** - फॉर्मेट करने के लिए `pnpm format` चलाएं
- **कोई रनटाइम डिपेंडेंसी नहीं** - पैकेज में शून्य रनटाइम डिपेंडेंसी होनी चाहिए
- **नामित एक्सपोर्ट** - डिफ़ॉल्ट एक्सपोर्ट से बचें
- **त्रुटि संदेश** - `[Tuvix ...]` के साथ प्रीफ़िक्स करें

## कमिट संदेश

हम [Conventional Commits](https://www.conventionalcommits.org/) का पालन करते हैं:

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Pull Request प्रक्रिया

1. `master` से एक ब्रांच बनाएं:

   ```bash
   git checkout -b feat/my-feature
   ```

2. अपने बदलाव करें और परीक्षण जोड़ें

3. पूर्ण परीक्षण सूट चलाएं:

   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. यदि आपका बदलाव किसी प्रकाशित पैकेज को प्रभावित करता है, तो changeset जोड़ें:

   ```bash
   pnpm changeset
   ```

5. Push करें और `master` के विरुद्ध PR खोलें

6. एक मेंटेनर आपके PR की समीक्षा करेगा। कृपया 7 दिनों के भीतर फीडबैक का जवाब दें।

## अनुवाद जोड़ना

सभी दस्तावेज़ीकरण `website/` के अंतर्गत Markdown में है। प्रत्येक भाषा की अपनी निर्देशिका है:

```
website/
├── index.md              ← अंग्रेज़ी (मूल)
├── guide/                ← अंग्रेज़ी गाइड
├── tr/                   ← तुर्की
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← स्पेनिश
└── ...
```

### अनुवाद जोड़ने या सुधारने के चरण

1. `website/guide/` से `website/<lang>/guide/` में अंग्रेज़ी फ़ाइलें कॉपी करें
2. Markdown सामग्री का अनुवाद करें (कोड ब्लॉक अंग्रेज़ी में रखें)
3. `website/.vitepress/config/<lang>.ts` में साइडबार कॉन्फ़िगरेशन अपडेट करें
4. पूर्वावलोकन के लिए `cd website && pnpm dev` चलाएं

::: tip अनुवाद सुझाव

- सभी कोड उदाहरण अंग्रेज़ी में रखें
- UI लेबल, विवरण और व्याख्यात्मक पाठ का अनुवाद करें
- जहां मानक अनुवाद मौजूद हैं वहां मूल शब्दावली का उपयोग करें
:::

## समर्थित भाषाएं

| भाषा | कोड | स्थिति |
|------|------|--------|
| अंग्रेज़ी | `en` | पूर्ण (संदर्भ) |
| तुर्की | `tr` | प्रगति पर |
| स्पेनिश | `es` | प्रगति पर |
| जर्मन | `de` | प्रगति पर |
| फ़्रेंच | `fr` | प्रगति पर |
| जापानी | `ja` | प्रगति पर |
| चीनी | `zh` | प्रगति पर |
| इतालवी | `it` | प्रगति पर |
| पुर्तगाली | `pt` | प्रगति पर |
| हिंदी | `hi` | प्रगति पर |

यदि आप इनमें से किसी भाषा में योगदान देना चाहते हैं, तो [खुले अनुवाद Issues](https://github.com/yasinatesim/tuvix.js/labels/translation) देखें या एक नया बनाएं।

## आचार संहिता

यह प्रोजेक्ट [Contributor Covenant](https://www.contributor-covenant.org/) का पालन करता है। सम्मानजनक और रचनात्मक बनें।

## लाइसेंस

योगदान करके, आप सहमत हैं कि आपके योगदान MIT लाइसेंस के तहत लाइसेंस किए जाएंगे।
