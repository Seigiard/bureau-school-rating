let studentLength = 100;

function doData(value) {
    studentLength = value.feed.entry[value.feed.entry.length-1]['gs$cell'].row-1;
    const result = value.feed.entry
        .reduce(parseData, [])
        .map(prepareChart);

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
    for(let i = 0; i < studentPointsLength; i = i + 2) {
        values.push({
            points: +student.values[i],
            place: +student.values[i+1],
            place_chart: studentLength - student.values[i+1],
        });
    }

    student.values = values;

    return student;
}

function getChartData(result){
    const charts = result
        .map(x => x.values)
        .reduce((p, n) => n.map((_, i) => [...(p[i] || []), n[i]]), []);


    const values = charts.map(x => x.reduce((result, x, id) => {
        if(id === 0) {
            result['date'] = x;
        } else {
        result['points_'+id] = x.points;
        result['place_'+id] = x.place;
        result['place_chart_'+id] = x.place_chart;
        }
        return result;
    }, {}));

    const graphs = charts[charts.length-1].reduce((result, x, id) => {
        if(id === 0) {
            return result;
        }

        result.push({
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
        return result;
    }, []);

    const ranks = result
        .map(x => Object.assign({}, {
            name: x.name,
            place: x.values[x.values.length-1].place
        }))
        .reduce((total, x) => {
            total[studentLength - x.place] = x.name;
            return total;
        }, []);

    return { values, graphs, ranks };
}

function drawChart(data) {
    var chart = AmCharts.makeChart("chartdiv", {
        "type": "serial",
        "theme": "light",
        autoMargins: false,
        marginTop: 0,
        marginBottom: 50,
        marginLeft: 0,
        marginRight: 180,
        "dataProvider": data.values,
        "valueAxes": [{
            "axisAlpha": 0,
            "position": "right",
            "gridThickness": 0,
            "labelFunction": position => data.ranks[position] || '',
        }],
        "categoryAxis": {
            "axisAlpha": 0,
            "gridThickness": 0,
        },
        "graphs": data.graphs,
        "categoryField": "date",
        "plotAreaBorderAlpha": 0,
    });
}
