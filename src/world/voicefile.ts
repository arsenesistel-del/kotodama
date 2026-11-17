// Nom du fichier de voix d'une réplique : « mansaku:again:1 » devient « mansaku.again_1 ».
// Sans DOM, partagé avec les scripts.
export const voiceFile = (lineId: string): string => {
  const k = lineId.lastIndexOf(':');
  return `${lineId.slice(0, k).replace(/:/g, '.')}_${lineId.slice(k + 1)}`;
};
