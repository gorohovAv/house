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
    const height = 120;
    const margin = { top: 10, right: 10, bottom: 30, left: 10 };

    const maxValue = Math.max(planned, actual);
    const scale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([height - margin.top - margin.bottom, 0]);

    // Создаем группу для графика
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Создаем столбцы
    const barWidth = 60;
    const barSpacing = 20;
    const chartWidth = barWidth * 2 + barSpacing;

    // Плановый столбец
    const plannedBar = g
      .append("rect")
      .attr("x", 0)
      .attr("y", height - margin.top - margin.bottom)
      .attr("width", barWidth)
      .attr("height", 0)
      .attr("fill", "#4CAF50")
      .attr("rx", 4);

    // Фактический столбец
    const actualBar = g
      .append("rect")
      .attr("x", barWidth + barSpacing)
      .attr("y", height - margin.top - margin.bottom)
      .attr("width", barWidth)
      .attr("height", 0)
      .attr("fill", "#FF9800")
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
      .attr("x", barWidth / 2)
      .attr("y", height - margin.top - margin.bottom + 20)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("План");

    g.append("text")
      .attr("x", barWidth + barSpacing + barWidth / 2)
      .attr("y", height - margin.top - margin.bottom + 20)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Факт");

    // Добавляем значения
    g.append("text")
      .attr("x", barWidth / 2)
      .attr("y", scale(planned) - 5)
      .attr("font-size", "11px")
      .attr("fill", "white")
      .attr("text-anchor", "middle")
      .text(planned.toLocaleString());

    g.append("text")
      .attr("x", barWidth + barSpacing + barWidth / 2)
      .attr("y", scale(actual) - 5)
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
        height={130}
        style={{ display: "block", margin: "0 auto" }}
      />
    </div>
  );
};

export default CostChart;
