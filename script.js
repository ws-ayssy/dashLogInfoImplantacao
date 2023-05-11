async function consultaDados() {
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/1KjsJXCNSSYO4vVivT7QxTNwTIqIq31LEBmmOUxgUkXw/gviz/tq?tqx=out:json');

    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    const data = await response.text();
    const json = JSON.parse(data.substring(47).slice(0, -2)).table;

    const headers = [];

    for (let i = 0; i < json.cols.length; i++) {
      if (json.cols[i].label != '' && i != 0) {
        headers.push(json.cols[i].label);
      }
    }

    createRow(headers, json);
  } catch (error) {
    console.error('Ocorreu um erro:', error);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: error.message
    });
  }
}



function createRow(cabecalhos, data)
{
  let allLines = []

  for(let i = 0; i < data.rows.length; i++)
  {
    let line = {}

    for(let y = 0; y < cabecalhos.length; y++)
    {
      if(data.rows[i].c[y+1] == null)
      {
        line[cabecalhos[y]] = ""
      }
      else
      {
        if(y == 4 || y == 5)
        {
          line[cabecalhos[y]] = data.rows[i].c[y+1].f
        }
        else
        {
          line[cabecalhos[y]] = data.rows[i].c[y+1].v
        }
      }
    }

    allLines.push(line)
  }

  dataAnalysis(allLines)
  prevEntrega(allLines)
  lateEntr(allLines)

}

function prevEntrega(allLines) 
{
  for(let i = 0; i < allLines.length; i++)
  {
    const dataPrev = allLines[i]["Prev. Entrega"]
    const dataEntrega = new Date(dataPrev.split("/").reverse().join("-"));
    const hoje = new Date();
    const diferencaDias = Math.ceil((dataEntrega.getTime() - hoje.getTime()) / 86400000);

    const ul = document.getElementById("main_ul")
    const row = []

    if((diferencaDias <= 10 && diferencaDias >= 0) && allLines[i]["Entrega"] == ""){
      console.log(allLines[i])
      document.getElementById('ul-h3').hidden = false
      for (let propriedade in allLines[i]) {
        if(allLines[i][propriedade] != "")
        row.push(allLines[i][propriedade])
      }
      const rowText = row.map(String).join("; ");
      let li = document.createElement('li')
      li.textContent = rowText
      li.className = "list-group-item"
      ul.appendChild(li);
    }
  }
}


function lateEntr(allLines) {
  const ul = document.getElementById('sec_ul');
  
  for (let i = 0; i < allLines.length; i++) {
    const dataPrev = allLines[i]["Prev. Entrega"];
    const dataPrevEntrega = new Date(dataPrev.split("/").reverse().join("-"));
    const hoje = new Date();
    
    const entrega = allLines[i]["Entrega"];
    const dataEntrega = entrega ? new Date(entrega.split("/").reverse().join("-")) : null;
    
    if (dataEntrega && dataEntrega.getTime() > dataPrevEntrega.getTime()) {
      document.getElementById('ul2-h3').hidden = false

      const row = Object.entries(allLines[i])
        .filter(([propriedade]) => {
          return propriedade !== "Status" && propriedade !== "Prev. Entrega" && propriedade !== "Entrega" && propriedade !== "Tipo"  && allLines[i][propriedade] !== "";
        })
        .map(([propriedade, valor]) => `<strong>${propriedade}:</strong> ${valor}`);

      const rowText = row.join("; ");
      const li = document.createElement('li');
      li.innerHTML = `<i class="fas fa-exclamation-triangle alert" style="color: rgb(236, 238, 95);"></i>${rowText}`;
      li.className = "list-group-item";
      li.title = `Previsão de Entrega: ${dataPrev} \nData de Entrega: ${entrega}`;

      ul.appendChild(li);
    } else if (dataPrevEntrega.getTime() < hoje.getTime() && !entrega) {
      const row = Object.entries(allLines[i])
        .filter(([propriedade]) => {
          return propriedade !== "Status" && propriedade !== "Prev. Entrega" && propriedade !== "Entrega" && propriedade !== "Tipo" && allLines[i][propriedade] !== "";
        })
        .map(([propriedade, valor]) => `<strong>${propriedade}:</strong> ${valor}`);

      const rowText = row.join("; ");
      const li = document.createElement('li');
      li.innerHTML = `<i class="fas fa-times danger" style="color: #FF5733;"></i>${rowText}`;
      li.className = "list-group-item";
      li.title = `Previsão de Entrega: ${dataPrev}`;

      ul.appendChild(li);
    }

  }
}


function dataAnalysis(organizedLines)
{
  let tipos = []
  let resps = []
  let status = []

  for(let i = 0; i < organizedLines.length; i++)
  {
    tipos.push(organizedLines[i].Tipo)
  }

  for(let i = 0; i < organizedLines.length; i++)
  {
    resps.push(organizedLines[i]["Resp."])
  }

  for(let i = 0; i < organizedLines.length; i++)
  {
    status.push(organizedLines[i].Status)
  }

  arrayCount(tipos, 0, "Tipos de Atividades", organizedLines)
  arrayCount(resps, 1, "Responsáveis", organizedLines)
  arrayCount(status, 2, "Status das Atividades", organizedLines)

}

function arrayCount(array, id, titulo, organizedLines)
{
  const count = {};
  
  array.forEach((element) => {
    if (count[element]) {
      count[element]++;
    } else {
      count[element] = 1;
    }
  });
  
  let labels = []
  let dados = []

  const chartContainer = document.getElementById('chartContainer')
  const canvas = document.createElement('canvas');
  canvas.id = `pie-chart-${id}`;
  canvas.classList.add('canvas-card');

  chartContainer.appendChild(canvas);
  
  // imprimir as contagens
  Object.keys(count).forEach((key) => {

    key == "" ? labels.push("Sem dados") : labels.push(key) 
    dados.push(count[key])

  });

  const pieChartData = {
    title: {
      text: titulo
    },
    labels: labels,
    datasets: [{
      backgroundColor: [
        "#68c37e",
        "#ff928c",
        "#a0d2db",
        "#ffb36d",
        "#81c1e7",
        "#ffdc6e",
        "#6dce9e",
        "#f395b2",
        "#82c5e7",
        "#c4c4c4"
      ],
      data: dados,
      borderWidth: 0.4, // adiciona uma borda de 2px ao redor do gráfico
      borderColor: 'grey'
    }]
  };

  new Chart(canvas, {
    type: 'pie',
    data: pieChartData,
    options: {
      onClick: (e, elements) => {
        if (elements.length > 0) {
          // Recupera o rótulo do setor clicado
          const label = elements[0]._model.label;
          showDetails(label, organizedLines)
        }
        
      },
      onHover: function(event, chartElement) {
        event.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
      },
      maintainAspectRatio: false,
      title: {
        fontSize: 19,
        display: true,
        text: titulo,
        fontColor: '#332F2E'
      },
      responsive: true,
      legend: {
        position: 'bottom',
        labels: {
          fontColor: '#332F2E',
          fontSize: 12.5,
          fontWeight: 'bold',
          padding: 15
          
        }
      },
      hover: {
        mode: 'index',
      },
    }
  });
}


function showDetails(value, organizedLines) {
  const modalContainer = document.createElement("section");
  modalContainer.classList.add("modal-container");

  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.classList.add("close-button");

  const table = document.createElement("table");
  table.classList.add("table");

  const headerRow = document.createElement("tr");
  for (let propriedade in organizedLines[0]) {
    const headerCell = document.createElement("th");
    headerCell.textContent = propriedade;
    headerRow.appendChild(headerCell);
  }
  table.appendChild(headerRow);

  for (let i = 0; i < organizedLines.length; i++) {
    const row = document.createElement("tr");
    let found = false;
    for (let propriedade in organizedLines[i]) {
      if (value == "Sem dados") {
        if (organizedLines[i][propriedade] === "" && propriedade == "Resp.") {
          found = true;
        }
      } else {
        if (organizedLines[i][propriedade] === value) {
          found = true;
        }
      }
      const cell = document.createElement("td");
      cell.textContent = organizedLines[i][propriedade];
      row.appendChild(cell);
    }
    if (found) {
      table.appendChild(row);
    }
  }

  document.getElementById("chartContainer").style.opacity = 0.2;
  document.querySelector('h2').style.opacity = 0.2;
  document.body.appendChild(closeButton);
  modalContainer.appendChild(table);
  document.body.appendChild(modalContainer);
  document.getElementById('main_ul') !== null ? document.getElementById('main_ul').style.opacity = 0.2 : ""
  document.getElementById('sec_ul') !== null ? document.getElementById('sec_ul').style.opacity = 0.2 : ""


  closeButton.addEventListener("click", function() {
    document.body.removeChild(modalContainer);
    document.body.removeChild(closeButton);
    document.getElementById("chartContainer").style.opacity = 1;
    document.querySelector('h2').style.opacity = 1;
    document.getElementById('main_ul') !== null ? document.getElementById('main_ul').style.opacity = 1 : ""
    document.getElementById('sec_ul') !== null ? document.getElementById('sec_ul').style.opacity = 1 : ""
    
  });
}
