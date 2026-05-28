# Kinephysio Redesign

Refonte statique one-page du site public du Centre Kinéphysio à Grenoble.

## Lancer en local

```bash
python3 -m http.server 8001
```

Puis ouvrir `http://localhost:8001`.

## Images

Les images publiques du site source sont téléchargées localement dans `assets/images/`.

```bash
node scripts/download-images.js
```

Le manifeste est généré dans `assets/images/manifest.json`.

Note : cette refonte est une proposition privée. Une mise en ligne finale doit utiliser les images avec l’accord du Centre Kinéphysio.
