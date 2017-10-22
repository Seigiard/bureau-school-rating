const chartMargin = {
    top: 25,
    bottom: 0,
    left: 0,
    right: 0,
}
const itemHeight = 50;
const itemMinWidth = 70;
const itemMaxWidth = 150;

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
    if (id === 0) {
        return student;
    }

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

    const graphs = getChartGraphs(charts, result);

    const currentLabels = getCurrentResultLabels(result, studentLength);
    // const startLabels = getStartResultLabels(result, studentLength);

    return {
        values,
        graphs,
        currentLabels,
        // startLabels
    };
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

function getChartGraphs(charts, students) {
    return charts[charts.length - 1].reduce((result, x, id) => {
        if (id === 0) {
            return result;
        }

        result.push({
            "valueAxis": 'current',
            "id": `gCurrent${id}`,
            "studentId": students[id].id,
            "balloonText": `<span class="student">[[place_${id}]]. ${students[id].name}</span><br /><span class="points">[[points_${id}]]</span>`,
            "type": "smoothedLine",
            "lineThickness": x.place <= 30 ? 1 : 1,
            "originalLineThickness": x.place <= 30 ? 1 : 1,
            "lineAlpha": x.place <= 30 ? 1 : .2,
            "originalLineAlpha": x.place <= 30 ? 1 : .2,
            "bullet": "round",
            "bulletAlpha": x.place <= 30 ? 1 : .5,
            "bulletSize": 2,
            "originalBulletSize": 2,
            "bulletHitAreaSize": 20,
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
        .map((x, id) => Object.assign({}, x, {
            place: id + 1
        }))
        .reduce((total, x) => {
            const place = studentLength - x.place;
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
            const placeDiffStyle = diffPlaces > 0 ? `place-diff_up` : (diffPlaces < 0 ? `place-diff_down` : ' ');
            total.push(`<div class='student-list_item' data-id='${x.id}'>
                <h2>
                    <span class='place'>${currentValues.place}.</span>
                    <span class="student-percentage" style="background-size:${100-currentValues.percentage_points}% 2px;">
                        <span class="student-name">${x.name}</span>
                        <span class='place-diff ${placeDiffStyle}'>${arrow}</span>
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

function renderStatistics(result) {
    const el = document.getElementById('stats');
    const lastValueId = result[0].values.length - 1;
    const list = result
        .slice(1)
        .map((x) => {
            const currentValues = x.values[lastValueId];
            const prevValues = x.values[lastValueId - 1];
            const diffPlaces = (currentValues.place - prevValues.place) * -1;
            const diffPoints = (currentValues.points - prevValues.points).toFixed(2);
            return {
                name: x.name,
                place: x.values[lastValueId].place,
                places: x.values.map(x => x.place),
                diffPlaces,
                diffPoints
            }
        })

    list.sort((a, b) => a.place - b.place);
    const leader = list.slice(0, 1)[0];
    const leaderWeeks = leader.places.reverse().join('').match(/^1+/)[0].length;

    list.sort((a, b) => b.diffPlaces - a.diffPlaces);
    const topUp = list[0].diffPlaces;
    const topScore = list.sort((a, b) => b.diffPoints - a.diffPoints).slice(0, 5).map(x => `${x.name} <em>+${x.diffPoints}</em>`).join(',<br />');

    el.appendChild(htmlToElement(`<dl>
            <dt>Лидер недели</dt><dd>${leader.name} <em>${leaderWeeks} ${pluralize(leaderWeeks, ['неделя', 'недели', 'недель'])}</em></dd>
            <dt>Взлёт недели</dt><dd>${getNamesByPlace(list, topUp)} <em>+${topUp} ${pluralize(topUp, ['место', 'места', 'мест'])}</em></dd>
            <dt>Умники недели</dt><dd>${topScore}</dd>
        </dl>
        `));
}

function getNamesByPlace(results, place) {
    return results.filter(x => x.diffPlaces === place).map(x => x.name).join(', ');
}

/**
 * Plural forms for russian words
 * @param  {Integer} count quantity for word
 * @param  {Array} words Array of words. Example: ['депутат', 'депутата', 'депутатов'], ['коментарий', 'коментария', 'комментариев']
 * @return {String}        Count + plural form for word
 */
function pluralize(count, words) {
    var cases = [2, 0, 1, 1, 1, 2];
    return words[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]];
}

function drawChart(data, studentLength) {
    return new Promise((resolve) => {
        var chart = AmCharts.makeChart("chartdiv", {
            "type": "serial",
            "theme": "light",
            autoMargins: false,
            marginTop: chartMargin.top,
            marginBottom: chartMargin.bottom,
            marginLeft: chartMargin.left,
            marginRight: chartMargin.right,
            "dataProvider": data.values,
            "chartCursor": {
                "oneBalloonOnly": true,
                cursorAlpha: 0.2,
                leaveCursor: true,
                fullWidth: false,
                zoomable: false,
            },
            "valueAxes": [{
                id: 'current',
                "axisAlpha": 0,
                "position": "left",
                "gridThickness": 0,
                "axisColor": '#fff',
                "color": '#ccc',
                gridCount: studentLength * 2,
                autoGridCount: false,
                strictMinMax: true,
                minimum: 0,
                maximum: studentLength + 1,
                "labelFunction": position => '',
                "listeners": [{
                    "event": "changed",
                    "method": x => resolve({
                        chart: x.chart
                    })
                }],
            }],
            "categoryAxis": {
                position: 'top',
                "axisAlpha": 0.1,
                "gridThickness": 0,
                "listeners": [
                    {
                        "event": "clickItem",
                        "method": x => x.chart.chartCursor.showCursorAt(x.value)
                    },
                ],
            },
            "graphs": data.graphs,
            "categoryField": "date",
            "plotAreaBorderAlpha": 0,
            "listeners": [
                {
                    "event": "init",
                    "method": x => resolve({
                        chart: x.chart
                    })
                },
                {
                    "event": "clickGraph",
                    "method": x => highlightStudentAndGraphById(x.graph.studentId, x.chart)
                },
            ],
        });
    })
}

function getSpreadSheet(url) {
    return fetch(url) // Call the fetch function passing the url of the API as a parameter
        .then(r => r.json())
        .catch(console.error);
}

function parseSpreadSheetData(value) {
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

    const chartHeight = studentLength * itemHeight + chartMargin.top + chartMargin.bottom;
    const chartMinWidth = result[0].values.length * itemMinWidth + chartMargin.left + chartMargin.right;
    const chartMaxWidth = result[0].values.length * itemMaxWidth + chartMargin.left + chartMargin.right;

    return {
        studentLength,
        chartHeight,
        chartMinWidth,
        chartMaxWidth,
        chartData,
        result
    }
}

function setElementsMeasurements(chartMinWidth, chartMaxWidth, chartHeight) {
    document.getElementById('chartdiv').style.minWidth = chartMinWidth + 'px';
    document.getElementById('chartdiv').style.maxWidth = chartMaxWidth + 'px';
    document.getElementById('chartdiv').style.height = chartHeight + 'px';
    document.getElementById('rating').style.maxWidth = (chartMaxWidth + 250) + 'px';
    document.getElementById('students').style.height = chartHeight + 'px';
}

function findAncestor(el, cls) {
    if (el.classList.contains(cls)) {
        return el;
    }
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
}

function getSiblings(originalEl) {
    var siblings = [];
    let el = originalEl.parentNode.firstChild;
    do {
        if (!el !== originalEl) siblings.push(el);
    } while (el = el.nextSibling);
    return siblings;
}

function orderDataset(dataset, sortFunction) {
    return Object.keys(dataset).reduce((r, k) => (r[k] = sortObjectByFunction(dataset[k], sortFunction), r), {});
}

function sortObjectByFunction(o, sortFunction) {
    return Object.keys(o).sort(sortFunction).reduce((r, k) => (r[k] = o[k], r), {});
}

function highlightStudentAndGraphById(id, chart){
    highlightStudentInListById(Number(id));
    highlightGraphById(Number(id), chart);
}

function highlightStudentInListById(id) {
    const container = document.getElementsByClassName('student-list')[0];
    const studentItems = [...container.childNodes];

    studentItems.forEach(i => {
        if (id === Number(i.dataset.id)) {
            i.classList.add('active');
        } else {
            i.classList.remove('active');
        }
    })
}

function highlightGraphById(id, chart) {
    let graphId = 'gCurrent' + id;

    chart.graphs.forEach(graph => {
        if (graph.valueAxis.id !== 'current') {
            return;
        }
        const isActiveGraph = graph.id === graphId
        graph.lineThickness = isActiveGraph ? 4 : graph.originalLineThickness;
        graph.lineAlpha = isActiveGraph ? 1 : graph.originalLineAlpha;
        graph.bulletSize = isActiveGraph ? 6 : graph.originalBulletSize;
    });
    chart.graphs.sort(graph => graph.id === graphId);
    chart.validateData();
}

function setLineHighlighter(chart) {
    const container = document.getElementsByClassName('student-list')[0];
    container.addEventListener('click', e => {
        var el = findAncestor(e.target, 'student-list_item');
        if (!el) {
            return;
        }

        highlightStudentAndGraphById(el.dataset.id, chart);
    });
}

function callAndResolve(func) {
    return function (x) {
        return Promise.resolve(func(x)).then(result => {
            const responce = result ? Object.assign(x, result) : x;
            return Promise.resolve(responce);
        })
    }
}

function loadChart(url) {
    // const url = 'https://spreadsheets.google.com/feeds/cells/1EIWgWQ8puUahC9U0OyM0hvtcaz9H7JFoLeZoGsxbFbw/1/public/values?alt=json';
    getSpreadSheet(url)
        .then(parseSpreadSheetData)
        .then(callAndResolve(x => setElementsMeasurements(x.chartMinWidth, x.chartMaxWidth, x.chartHeight)))
        .then(callAndResolve(x => renderCurrentStudents(x.result)))
        .then(callAndResolve(x => renderStatistics(x.result)))
        .then(callAndResolve(x => drawChart(x.chartData, x.studentLength)))
        .then(callAndResolve(x => setLineHighlighter(x.chart)))
        .then(callAndResolve(x => {
            document.getElementsByClassName('student-list_item')[0].click();
            document.getElementsByClassName('flex-item-1')[0].scrollTo(100000, 0);
        }));
}