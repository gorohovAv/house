import { useState, useRef, useEffect } from "react";

interface LayerConfig {
  id: string;
  assetPath: string;
  zIndex: number;
  opacity: number;
  visible: boolean;
  blendMode?: GlobalCompositeOperation;
  offsetX?: number;
  offsetY?: number;
  scaleX?: number;
  scaleY?: number;
}

interface LayeredImageConfig {
  width: number;
  height: number;
  layers: LayerConfig[];
}

interface LayeredCanvasProps {
  config: LayeredImageConfig;
}

const LayeredCanvas = ({ config }: LayeredCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImages, setLoadedImages] = useState<
    Map<string, HTMLImageElement>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем все изображения
  useEffect(() => {
    const loadImages = async () => {
      const imageMap = new Map<string, HTMLImageElement>();
      const loadPromises = config.layers.map((layer) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            imageMap.set(layer.id, img);
            resolve();
          };
          img.onerror = () => {
            console.warn(
              `Не удалось загрузить изображение: ${layer.assetPath}`
            );
            // Создаем заглушку для отсутствующих изображений
            const placeholder = new Image();
            placeholder.src = `https://via.placeholder.com/${config.width}x${config.height}/cccccc/ffffff?text=${layer.id}`;
            placeholder.onload = () => {
              imageMap.set(layer.id, placeholder);
              resolve();
            };
          };
          img.src = layer.assetPath;
        });
      });

      try {
        await Promise.all(loadPromises);
        setLoadedImages(imageMap);
        setIsLoading(false);
      } catch (error) {
        console.error("Ошибка загрузки изображений:", error);
        setIsLoading(false);
      }
    };

    loadImages();
  }, [config]);

  // Рисуем слои на canvas
  useEffect(() => {
    if (isLoading || loadedImages.size === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Получаем видимые слои, отсортированные по zIndex
    const visibleLayers = config.layers
      .filter((layer) => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    // Рисуем каждый слой
    visibleLayers.forEach((layer) => {
      const img = loadedImages.get(layer.id);
      if (!img) return;

      ctx.save();

      // Устанавливаем режим смешивания
      if (layer.blendMode) {
        ctx.globalCompositeOperation = layer.blendMode;
      }

      // Устанавливаем прозрачность
      ctx.globalAlpha = layer.opacity;

      // Применяем трансформации
      const offsetX = layer.offsetX || 0;
      const offsetY = layer.offsetY || 0;
      const scaleX = layer.scaleX || 1;
      const scaleY = layer.scaleY || 1;

      ctx.translate(offsetX, offsetY);
      ctx.scale(scaleX, scaleY);

      // Рисуем изображение
      ctx.drawImage(img, 0, 0, config.width, config.height);

      ctx.restore();
    });
  }, [config, loadedImages, isLoading]);

  if (isLoading) {
    return (
      <div className="canvas-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка изображений...</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={config.width}
      height={config.height}
      className="layered-canvas"
    />
  );
};

export default LayeredCanvas;
