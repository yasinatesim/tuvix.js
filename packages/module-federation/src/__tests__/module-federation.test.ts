import { describe, it, expect } from 'vitest';
import { createFederatedLoader, federatedEntry } from '../index';

describe('createFederatedLoader', () => {
  it('should create a loader with configured remotes', () => {
    const loader = createFederatedLoader({
      remotes: [
        { name: 'dashboard', url: 'https://cdn.example.com/remoteEntry.js' },
      ],
    });

    expect(loader).toBeDefined();
    expect(typeof loader.loadModule).toBe('function');
    expect(typeof loader.loadRemoteContainer).toBe('function');
    expect(typeof loader.createFederatedEntry).toBe('function');
    expect(typeof loader.createFederatedApp).toBe('function');
  });

  it('should throw when loading unconfigured remote', async () => {
    const loader = createFederatedLoader({ remotes: [] });

    await expect(loader.loadModule('unknown', './App')).rejects.toThrow(
      'not configured'
    );
  });
});

describe('federatedEntry', () => {
  it('should create an Entry from a RemoteConfig', () => {
    const entry = federatedEntry({
      name: 'my-remote',
      url: 'https://cdn.example.com/remoteEntry.js',
    });

    expect(entry).toEqual({
      scripts: ['https://cdn.example.com/remoteEntry.js'],
    });
  });
});
