# School Quest Dashboard

Interactive school practice dashboard with:

- student profiles
- Year 4 times-table worksheet practice
- attempt counts and completed worksheet tracking
- local progress storage
- optional Firebase sync across devices

## Firebase

Firebase sync is configured in `data/firebase-config.js`.

For online hosting, add the deployed domain to:

Firebase Console -> Authentication -> Settings -> Authorized domains

For GitHub Pages this will usually be:

```text
maddernsplace.github.io
```

## Local Preview

```powershell
python -m http.server 4177 --bind 127.0.0.1
```

Then open:

```text
http://localhost:4177/
```
