let newElevationChart;

export function generateChart(elevationArray, totalDistanceMeters) {
  const canvas = document.getElementById('elevation-chart-js');
  const elevationChart = canvas.getContext('2d');

  const labels = elevationArray.map(() => '');

  if (newElevationChart) { newElevationChart.destroy() };

  const minValue = Math.min(...elevationArray);
  const maxValue = Math.max(...elevationArray);
  let minChartY;
  let maxChartY;
  if (maxValue - minValue > 100) {
    minChartY = Math.max(0, Math.floor(minValue - minValue * 0.1));
    maxChartY = Math.ceil(maxValue + maxValue * 0.1);
  } else if (minValue < 50) {
    minChartY = 0;
    maxChartY = 100;
  } else {
    minChartY = minValue - 30;
    maxChartY = maxValue + 30;
  }

  let gradient = elevationChart.createLinearGradient(0, 0, 0, canvas.height);
  let borderColor;

  gradient.addColorStop(0, 'rgba(0, 153, 255, 0.6)');
  gradient.addColorStop(1, 'rgba(0, 153, 255, 0)');
  borderColor = 'rgb(0, 153, 255)';

  newElevationChart = new Chart(elevationChart, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: elevationArray,
        borderColor: borderColor,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        backgroundColor: gradient,
        fill: true,
      }],
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      interaction: {
        mode: null
      },
      scales: {
        y: {
          min: minChartY,
          max: maxChartY,
          grid: {
            display: false
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            callback: function (index) {
              const distanceKm = (index / (elevationArray.length - 1)) * (totalDistanceMeters / 1000);
              return distanceKm.toFixed(2) + ' km';
            },
            maxTicksLimit: 10,
          }
        }
      }
    }
    });
}