Act as a senior software engineer, expert in react, offfline-pwa, indexDB and firebase.

Resolve the following first, start with understanding the root cause.

- Below the project structure.

```
├── eslint.config.js
├── index.html
├── package.json
├── pnpm-lock.yaml
├── public
│   ├── about.txt
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   └── manifest.json
├── README.md
├── src
│   ├── App.jsx
│   ├── components
│   │   ├── ContentsTable.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DraftDetail.jsx
│   │   ├── EditDraft.jsx
│   │   ├── EditIdea.jsx
│   │   ├── IdeaDetail.jsx
│   │   ├── InstallPrompt.jsx
│   │   ├── Login.jsx
│   │   ├── Navbar.jsx
│   │   ├── NewDraft.jsx
│   │   ├── NewIdea.jsx
│   │   └── ViewDrafts.jsx
│   ├── context
│   │   └── AuthContext.jsx
│   ├── index.css
│   ├── main.jsx
│   ├── services
│   └── utils
│       ├── db.js
│       └── firebase.js
└── vite.config.js
```

## Issue

- In android application when I click on `Sign in with Google`, it blinks and nothing happens and when I try to do it in a desktop using mobile simulator extension, I get `The requested action is invalid.`
- Can you find the issue and resolve it.

```jsx
function Login() {
  const { login, loading } = useAuth();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#210F37] text-gray-200 px-4 sm:px-6 lg:px-8">
      {loading ? (
        <div className="text-base sm:text-lg">Loading...</div>
      ) : (
        <div className="p-4 sm:p-6 bg-[#4F1C51] rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-xl sm:text-2xl font-semibold text-[#DCA06D] mb-4 sm:mb-6 text-center">
            Content Idea Logger
          </h1>
          <button
            onClick={login}
            className="w-full bg-[#A55B4B] text-gray-200 py-2 px-4 rounded-md text-sm sm:text-base font-medium hover:bg-[#210F37] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#DCA06D] focus:ring-opacity-50"
          >
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}
```

- What other file do you need?