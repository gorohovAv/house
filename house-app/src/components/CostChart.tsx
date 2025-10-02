import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface CostChartProps {
  planned: number;
  actual: number;
  title: string;
}

const CostChart: React.FC<CostChartProps> = ({ planned, actual, title }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Очищаем предыдущий график

    const width = 200;
    const height = 140; // Увеличиваем высоту для надписей
    const margin = { top: 30, right: 20, bottom: 40, left: 20 }; // Увеличиваем отступы

    const maxValue = Math.max(planned, actual);
    const scale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([height - margin.top - margin.bottom, 0]);

    // Создаем группу для графика
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Создаем столбцы - убираем промежуток между ними
    const barWidth = 70;
    const barSpacing = 0; // Убираем промежуток
    const chartWidth = barWidth * 2 + barSpacing;
    const chartStartX = (width - margin.left - margin.right - chartWidth) / 2; // Центрируем

    // Плановый столбец
    const plannedBar = g
      .append("rect")
      .attr("x", chartStartX)
      .attr("y", height - margin.top - margin.bottom)
      .attr("width", barWidth)
      .attr("height", 0)
      .attr("fill", "#105ca9")
      .attr("rx", 4);

    // Фактический столбец
    const actualBar = g
      .append("rect")
      .attr("x", chartStartX + barWidth + barSpacing)
      .attr("y", height - margin.top - margin.bottom)
      .attr("width", barWidth)
      .attr("height", 0)
      .attr("fill", "#ff6910")
      .attr("rx", 4);

    // Анимация появления столбцов
    plannedBar
      .transition()
      .duration(800)
      .attr("height", height - margin.top - margin.bottom - scale(planned))
      .attr("y", scale(planned));

    actualBar
      .transition()
      .duration(800)
      .delay(200)
      .attr("height", height - margin.top - margin.bottom - scale(actual))
      .attr("y", scale(actual));

    // Добавляем подписи
    g.append("text")
      .attr("x", chartStartX + barWidth / 2)
      .attr("y", height - margin.top - margin.bottom + 20)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle");
    //.text("План");

    g.append("text")
      .attr("x", chartStartX + barWidth + barSpacing + barWidth / 2)
      .attr("y", height - margin.top - margin.bottom + 20)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle");
    //.text("Факт");

    // Добавляем значения - размещаем их выше столбцов с достаточным отступом
    g.append("text")
      .attr("x", chartStartX + barWidth / 2)
      .attr("y", Math.max(scale(planned) - 10, 15)) // Минимум 15px от верха
      .attr("font-size", "11px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .text(planned.toLocaleString());

    g.append("text")
      .attr("x", chartStartX + barWidth + barSpacing + barWidth / 2)
      .attr("y", Math.max(scale(actual) - 10, 15)) // Минимум 15px от верха
      .attr("font-size", "11px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .text(actual.toLocaleString());
  }, [planned, actual]);

  return (
    <div className="cost-chart-container">
      <div className="chart-title">{title}</div>
      <svg
        ref={svgRef}
        width={200}
        height={150}
        style={{ display: "block", margin: "0 auto" }}
      />
    </div>
  );
};

export default CostChart;
