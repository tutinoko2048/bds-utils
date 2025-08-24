export class ManifestNotFoundError extends Error {
  constructor() {
    super('manifest.json not found');
    this.name = 'ManifestNotFoundError';
  }
}
