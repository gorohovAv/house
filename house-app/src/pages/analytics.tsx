import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Plot from "react-plotly.js";
import "./analytics.css";

export default function AnalyticsPage() {
  const [plotData, setPlotData] = useState<any>(null);

  useEffect(() => {
    // Данные для графика
    const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн"];
    const values = [120, 180, 250, 200, 280, 150];

    const data = [
      {
        x: months,
        y: values,
        type: "bar",
        name: "Потребление",
        marker: {
          color: "rgba(102, 126, 234, 0.8)",
          line: {
            color: "rgba(102, 126, 234, 1)",
            width: 1,
          },
        },
      },
      {
        x: months,
        y: values,
        type: "scatter",
        mode: "lines+markers",
        name: "Тренд",
        line: {
          color: "#ff6b6b",
          width: 3,
        },
        marker: {
          color: "#ff6b6b",
          size: 8,
        },
      },
    ];

    const layout = {
      title: {
        text: "Аналитика потребления энергии",
        font: { size: 18, color: "#333" },
      },
      xaxis: {
        title: "Месяцы",
        showgrid: true,
        gridcolor: "rgba(128,128,128,0.2)",
      },
      yaxis: {
        title: "КВт⋅ч",
        showgrid: true,
        gridcolor: "rgba(128,128,128,0.2)",
      },
      plot_bgcolor: "rgba(0,0,0,0)",
      paper_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#333" },
      legend: {
        x: 0.02,
        y: 0.98,
        bgcolor: "rgba(255,255,255,0.8)",
        bordercolor: "rgba(0,0,0,0.2)",
        borderwidth: 1,
      },
      margin: { l: 60, r: 30, t: 60, b: 60 },
    };

    const config = {
      displayModeBar: false,
      responsive: true,
    };

    setPlotData({ data, layout, config });
  }, []);

  return (
    <div className="analytics-page">
      <div className="chart-container">
        {plotData && (
          <Plot
            data={plotData.data}
            layout={plotData.layout}
            config={plotData.config}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </div>

      <div className="navigation">
        <Link to="/plan" className="nav-link">
          Дом
        </Link>
      </div>

      <div className="page-spacer"></div>
    </div>
  );
}
