let studentLength = undefined;

function doData(value) {
    studentLength = value.feed.entry[value.feed.entry.length-1]['gs$cell'].row-1;

    const result = value.feed.entry
        .reduce(parseData, [])
        .map(prepareChart);

    result[0].values.forEach((x, id) => {
        setRatingByColumn(id)(result);
    })

    timeline = result[0];

    drawChart(getChartData(result));
}

function parseData(total, row, id) {
    const cell = row['gs$cell'];
    const cellRow = cell.row-1;

    if(!total[cellRow]) {
        total[cellRow] = {
        name: cell['$t'],
        values: []
    };
    } else {
        total[cellRow].values.push(cell['$t']);
    }
    return total;
}

function prepareChart(student, id){
    if(id === 0) { return student; }

    const values = [];

    const studentPointsLength = student.values.length;
    for(let i = 0; i < studentPointsLength; i++) {
        values.push({
            points: +student.values[i],
        });
    }

    student.values = values;

    return student;
}

function getChartData(result){
    const charts = result
        .map(x => x.values)
        .reduce((p, n) => n.map((_, i) => [...(p[i] || []), n[i]]), []);


    const values = getChartValues(charts);

    const graphs = getChartGraphs(charts);

    const currentLabels = getCurrentResultLabels(result);
    const startLabels = getStartResultLabels(result);

    return { values, graphs, currentLabels, startLabels };
}

function getChartValues(charts) {
    return charts.map(x => x.reduce((result, x, id) => {
        if(id === 0) {
            result['date'] = x;
        } else {
        result['points_'+id] = x.points;
        result['place_'+id] = x.place;
        result['place_chart_'+id] = x.place_chart;
        }
        return result;
    }, {}))
}

function getChartGraphs(charts) {
    return charts[charts.length-1].reduce((result, x, id) => {
        if(id === 0) {
            return result;
        }

        result.push({
            "valueAxis": 'start',
            "id":`g${id}`,
            "balloonText": `<b>[[place_${id}]]</b><br />[[points_${id}]]`,
            "type": "smoothedLine",
            "lineThickness": x.place <= 30 ? 1 : 1,
            "lineAlpha": x.place <= 30 ? 1 : .2,
            "bullet":"round",
            "bulletAlpha": x.place <= 30 ? 1 : .5,
            "bulletSize":2,
            "bulletBorderAlpha":0,
            "valueField": `place_chart_${id}`
        });

        result.push({
            "valueAxis": 'current',
            "id":`g2${id}`,
            "balloonText": `<b>[[place_${id}]]</b><br />[[points_${id}]]`,
            "type": "smoothedLine",
            "lineThickness": x.place <= 30 ? 1 : 1,
            "lineAlpha": x.place <= 30 ? 1 : .2,
            "bullet":"round",
            "bulletAlpha": x.place <= 30 ? 1 : .5,
            "bulletSize":2,
            "bulletBorderAlpha":0,
            "valueField": `place_chart_${id}`
        });
        return result;
    }, [])
}

function getCurrentResultLabels(result) {
    return result
        .slice(1)
        .map(x => Object.assign({}, {
            name: x.name,
            place: x.values[x.values.length-1].place
        }))
        .sort((a, b) => a.place - b.place)
        .reduce((total, x) => {
            const place = studentLength - x.place;
            total[place] = `${x.place}. ${x.name}`;
            return total;
        }, [])
}

function getStartResultLabels(result) {
    return result
        .slice(1)
        .map(x => Object.assign({}, {
            name: x.name,
            place: x.values[0].place
        }))
        .sort((a, b) => a.place - b.place)
        .map((x, id) => Object.assign({}, x, { place: id+1 }))
        .reduce((total, x) => {
            const place = studentLength - x.place;
            // console.error(x.place,place, x.name);
            total[place] = `${x.place}. ${x.name}`;
            return total;
        }, [])
}

function setRatingByColumn(i) {
    return function(results) {
        const data = results
            .slice(1)
            .map((x, id) => {
                x.id = id;
                return x;
            })
            .sort((a, b) => b.values[i].points - a.values[i].points)
            .map((x, id) => {
                x.values[i].place = id+1;
                x.values[i].place_chart = studentLength - id;
                return x;
            });
    }
}

function drawChart(data) {
    var chart = AmCharts.makeChart("chartdiv", {
        "type": "serial",
        "theme": "light",
        autoMargins: false,
        marginTop: 50,
        marginBottom: 20,
        marginLeft: 180,
        marginRight: 180,
        "dataProvider": data.values,
        "valueAxes": [{
            id: 'current',
            "axisAlpha": 0,
            "position": "right",
            "gridThickness": 0,
            "axisColor": '#fff',
            "labelFunction": position => data.currentLabels[position-1] || '',
        }, {
            id: 'start',
            "axisAlpha": 0,
            "position": "left",
            "gridThickness": 0,
            "axisColor": '#fff',
            "labelFunction": position => data.startLabels[position-1] || '',
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
}
