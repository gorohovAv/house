import React from "react";

interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = "",
}) => {
  // Функция для безопасного рендеринга HTML с ограниченным набором тегов
  const renderFormattedText = (htmlString: string) => {
    // Разрешенные теги для форматирования
    const allowedTags = ["b", "strong", "i", "em", "u", "br", "span"];

    // Создаем временный div для парсинга HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    // Рекурсивно обрабатываем узлы
    const processNode = (node: Node): React.ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        // Проверяем, разрешен ли тег
        if (!allowedTags.includes(tagName)) {
          return element.textContent; // Возвращаем только текст без тега
        }

        const children = Array.from(element.childNodes).map(processNode);

        switch (tagName) {
          case "b":
          case "strong":
            return <strong key={Math.random()}>{children}</strong>;
          case "i":
          case "em":
            return <em key={Math.random()}>{children}</em>;
          case "u":
            return <u key={Math.random()}>{children}</u>;
          case "br":
            return <br key={Math.random()} />;
          case "span":
            const spanElement = element as HTMLSpanElement;
            const spanClassName = spanElement.className;
            return (
              <span key={Math.random()} className={spanClassName}>
                {children}
              </span>
            );
          default:
            return children;
        }
      }

      return null;
    };

    return Array.from(tempDiv.childNodes).map((node, index) => (
      <React.Fragment key={index}>{processNode(node)}</React.Fragment>
    ));
  };

  return <span className={className}>{renderFormattedText(text)}</span>;
};
