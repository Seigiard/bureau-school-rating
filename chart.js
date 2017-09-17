const chartMargin = {
    top: 25,
    bottom: 10,
    left: 180,
    right: 250,
}

function parseData(total, row, id) {
    const cell = row['gs$cell'];
    const cellRow = cell.row - 1;

    if (!total[cellRow]) {
        total[cellRow] = {
            name: cell['$t'],
            values: []
        };
    } else {
        total[cellRow].values.push(cell['$t']);
    }
    return total;
}

function prepareChart(student, id) {
    if (id === 0) { return student; }

    const values = [];

    const studentPointsLength = student.values.length;
    for (let i = 0; i < studentPointsLength; i++) {
        values.push({
            points: +student.values[i],
        });
    }

    student.values = values;

    return student;
}

function getChartData(result, studentLength) {
    const charts = result
        .map(x => x.values)
        .reduce((p, n) => n.map((_, i) => [...(p[i] || []), n[i]]), []);


    const values = getChartValues(charts);

    const graphs = getChartGraphs(charts);

    const currentLabels = getCurrentResultLabels(result, studentLength);
    const startLabels = getStartResultLabels(result, studentLength);

    return { values, graphs, currentLabels, startLabels };
}

function getChartValues(charts) {
    return charts.map(x => x.reduce((result, x, id) => {
        if (id === 0) {
            result['date'] = x;
        } else {
            result['points_' + id] = x.points;
            result['place_' + id] = x.place;
            result['place_chart_' + id] = x.place_chart;
            result['percentage_points_' + id] = x.percentage_points;
        }
        return result;
    }, {}))
}

function getChartGraphs(charts) {
    return charts[charts.length - 1].reduce((result, x, id) => {
        if (id === 0) {
            return result;
        }

        result.push({
            "valueAxis": 'start',
            "id": `gStart${id}`,
            "balloonText": ``,
            "type": "smoothedLine",
            "lineThickness": 0,
            "lineAlpha": 0,
            "bullet": "round",
            "bulletAlpha": 0,
            "bulletSize": 0,
            "bulletBorderAlpha": 0,
            "valueField": `place_chart_${id}`
        });

        result.push({
            "valueAxis": 'current',
            "id": `gCurrent${id}`,
            "balloonText": `<b>[[place_${id}]]</b><br />[[points_${id}]]`,
            "type": "smoothedLine",
            "lineThickness": x.place <= 30 ? 1 : 1,
            "originalLineThickness": x.place <= 30 ? 1 : 1,
            "lineAlpha": x.place <= 30 ? 1 : .2,
            "originalLineAlpha": x.place <= 30 ? 1 : .2,
            "bullet": "round",
            "bulletAlpha": x.place <= 30 ? 1 : .5,
            "bulletSize": 2,
            "bulletBorderAlpha": 0,
            "valueField": `place_chart_${id}`
        });
        return result;
    }, [])
}

function getCurrentResultLabels(result, studentLength) {
    const lastValueId = result[0].values.length - 1;
    return result
        .slice(1)
        .map(x => Object.assign({}, {
            name: x.name,
            place: x.values[lastValueId].place
        }))
        .sort((a, b) => a.place - b.place)
        .reduce((total, x) => {
            const place = studentLength - x.place;
            total[place] = `${x.place}. ${x.name}`;
            return total;
        }, [])
}

function getStartResultLabels(result, studentLength) {
    return result
        .slice(1)
        .map(x => Object.assign({}, {
            name: x.name,
            place: x.values[0].place
        }))
        .sort((a, b) => a.place - b.place)
        .map((x, id) => Object.assign({}, x, { place: id + 1 }))
        .reduce((total, x) => {
            const place = studentLength - x.place;
            // console.error(x.place,place, x.name);
            total[place] = `${x.place}. ${x.name}`;
            return total;
        }, [])
}

function setRatingByColumn(i, studentLength) {
    return function (results) {
        const data = results.slice(1)
            .sort((a, b) => b.values[i].points - a.values[i].points);

        const minPoints = data[data.length - 1].values[i].points;
        const maxPoints = data[0].values[i].points;

        data
            .forEach((x, id) => {
                const result = results[x.id].values[i];
                result.place = id + 1;
                result.place_chart = studentLength - id;
                result.percentage_points = (result.points * 100 / maxPoints).toFixed(2);
                return x;
            });
    }
}

function htmlToElement(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild;
}

function renderCurrentStudents(result) {
    const el = document.getElementById('students');
    const lastValueId = result[0].values.length - 1;
    const list = result
        .slice(1)
        .sort((a, b) => a.values[lastValueId].place - b.values[lastValueId].place)
        .reduce((total, x) => {
            const currentValues = x.values[lastValueId];
            const prevValues = x.values[lastValueId - 1];
            const diffPlaces = (currentValues.place - prevValues.place) * -1;
            const currentPoint = currentValues.points.toFixed(2);
            const diffPoints = (currentValues.points - prevValues.points).toFixed(2);
            const arrow = diffPlaces > 0 ? `↑${Math.abs(diffPlaces)}` : (diffPlaces < 0 ? `↓${Math.abs(diffPlaces)}` : ' ');
            total.push(`<div class='student-list_item' data-id='${x.id}'>
                <h2>
                    <span class='place'>${currentValues.place}.</span>
                    <span class="student-percentage" style="background-size:${100-currentValues.percentage_points}% 2px;">
                        <span class="student-name">${x.name}</span>
                        <span class='place-diff'>${arrow}</span>
                    </span>
                </h2>
                <p>
                    <span class='points'>${currentPoint} <small>+${diffPoints}</small></span>
                </p>
            </div>`);
            return total;
        }, [])
        .join('');

    el.appendChild(htmlToElement(`<div class='student-list'>${list}</div>`));
}

function drawChart(data, studentLength) {
    var chart = AmCharts.makeChart("chartdiv", {
        "type": "serial",
        "theme": "light",
        autoMargins: false,
        marginTop: chartMargin.top,
        marginBottom: chartMargin.bottom,
        marginLeft: chartMargin.left,
        marginRight: chartMargin.right,
        "dataProvider": data.values,
        "valueAxes": [{
            id: 'start',
            "axisAlpha": 0,
            "position": "left",
            "gridThickness": 0,
            "axisColor": '#fff',
            "color": '#ccc',
            "labelFunction": position => data.startLabels[position - 1] || '',
        }, {
            id: 'current',
            "axisAlpha": 0,
            "position": "right",
            "gridThickness": 0,
            "axisColor": '#fff',
            "color": '#fff',
            ignoreAxisWidth: true,
            gridCount: studentLength * 2,
            autoGridCount: true,
            minHorizontalGap: 20,
            labelFunction: position => ''
        }],
        "categoryAxis": {
            position: 'top',
            "axisAlpha": 0.1,
            "gridThickness": 0,
        },
        "graphs": data.graphs,
        "categoryField": "date",
        "plotAreaBorderAlpha": 0,
    });

    return { chart };
}

function getSpreadSheet(url) {
    return fetch(url) // Call the fetch function passing the url of the API as a parameter
        .then(r => r.json())
        .catch(console.error);
}

function parseSpreadSheetData(value) {
    const itemHeight = 50;
    const itemWidth = 150;
    const studentLength = value.feed.entry[value.feed.entry.length - 1]['gs$cell'].row - 1;

    const result = value.feed.entry
        .reduce(parseData, [])
        .map(prepareChart)
        .map((x, id) => {
            x.id = id;
            return x;
        });

    result[0].values.forEach((x, id) => {
        setRatingByColumn(id, studentLength)(result);
    })

    const chartData = getChartData(result, studentLength);

    const chartHeight = studentLength * itemHeight + 5;
    const chartWidth = result[0].values.length * itemWidth + chartMargin.left + chartMargin.right;

    return {
        studentLength,
        chartHeight,
        chartWidth,
        chartData,
        result
    }
}

function setElementsMeasurements(chartWidth, chartHeight) {
    document.getElementById('chartdiv').style.width = chartWidth + 'px';
    document.getElementById('chartdiv').style.height = chartHeight + 'px';
    document.getElementById('rating').style.width = chartWidth + 'px';
    document.getElementById('students').style.height = chartHeight + 'px';
}

function findAncestor(el, cls) {
    if(el.classList.contains(cls)) {
        return el;
    }
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
}

function getSiblings(originalEl) {
    var siblings = [];
    let el = originalEl.parentNode.firstChild;
    do { if (!el !== originalEl) siblings.push(el); } while (el = el.nextSibling);
    return siblings;
}

function orderDataset(dataset, sortFunction) {
    return Object.keys(dataset).reduce((r, k) => (r[k] = sortObjectByFunction(dataset[k], sortFunction), r), {});
}

function sortObjectByFunction(o, sortFunction) {
    return Object.keys(o).sort(sortFunction).reduce((r, k) => (r[k] = o[k], r), {});
}

function setLineHighlighter(chart) {
    const container = document.getElementsByClassName('student-list')[0];
    const studentItems = [...container.childNodes];

    container.addEventListener('click', e => {
        var el = findAncestor(e.target, 'student-list_item');
        if (!el) { return; }

        studentItems.forEach(i => {
            if(i === el) {
                i.classList.toggle('active');
            } else {
                i.classList.remove('active');
            }
        })

        let graphId = 'gCurrent' + el.dataset.id;

        if(!el.classList.contains('active')) {
            graphId = '_und';
        }

        chart.graphs.forEach(graph => {
            if(graph.valueAxis.id !== 'current') {
                return;
            }
            const isActiveGraph = graph.id === graphId
            graph.lineThickness = isActiveGraph ? 4 : graph.originalLineThickness;
            graph.lineAlpha = isActiveGraph ? 1 : graph.originalLineAlpha;
        });
        chart.graphs.sort(graph => graph.id === graphId);
        chart.validateData();
    });
}

function callAndResolve(func) {
    return function (x) {
        const result = func(x);
        const responce = result ? Object.assign(x, result) : x;
        return Promise.resolve(responce);
    }
}

function loadChart(url) {
    // const url = 'https://spreadsheets.google.com/feeds/cells/1EIWgWQ8puUahC9U0OyM0hvtcaz9H7JFoLeZoGsxbFbw/1/public/values?alt=json';
    getSpreadSheet(url)
        .then(parseSpreadSheetData)
        .then(callAndResolve(x => setElementsMeasurements(x.chartWidth, x.chartHeight)))
        .then(callAndResolve(x => renderCurrentStudents(x.result)))
        .then(callAndResolve(x => drawChart(x.chartData, x.studentLength)))
        .then(callAndResolve(x => setLineHighlighter(x.chart)))
        .then(callAndResolve(x => {
            document.getElementsByClassName('student-list_item')[0].click();
        }));
}
