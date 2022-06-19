//define([ 'windy/Particle', 'windy/WindField'], function ( Particle, WindField) {
var _primitives = null;
var billboards = null;
var particleAge = 5000;
var SPEED_RATE = 3.6 * 4 * 24 * 5000 / particleAge; //0.001真实场景
var PARTICLES_NUMBER = 1; //默认2000
var MAX_AGE = 15;
var BRIGHTEN = 1.5;
var isRect = false;
var rectInstances = [];
var fieldGroup = [];
var acFactor = 0.1;
var frictionFactor = 0.9;
var UCTFirst = true;
var Windy = function(json, cesiumViewer) {
    this.windData = json;
    this.windField = null;
    this.nextField = null;
    this.maxAge = null;
    this.minAge = null;
    this.particles = [];
    this.lines = null;
    this.viewer = cesiumViewer;
    _primitives = cesiumViewer.scene.primitives;
};

Windy.prototype = {
    constructor: Windy,
    _init: function(x1, y1, x2, y2) {
        billboards = viewer.scene.primitives.add(new Cesium.BillboardCollection());
        // 创建矢量场数组
        for (let i = 0; i < 5; i++) {
            fieldGroup.push(this.createField(i))
        }
        if (isNeg) {
            fieldGroup = fieldGroup.reverse()
        }
        this.windField = fieldGroup[0];
        this.nextField = fieldGroup[1];
        this.maxAge = particleAge, this.minAge = particleAge * 3 / 4;
        // 创建粒子
        PARTICLES_NUMBER = 1
        if (isRect) {
            PARTICLES_NUMBER = 10
        }
        if (isUCT) {
            PARTICLES_NUMBER = 101
        }
        if (isWindFlow) {
            PARTICLES_NUMBER = 200
        }
        if (!isCover) {
            for (var i = 0; i < PARTICLES_NUMBER; i++) {
                this.particles.push(this.randomParticle(new Particle(), x1, y1, x2, y2));
                if (!isWindFlow) {
                    this._addIcons(this.particles[this.particles.length - 1])
                }
            }
            /*******timer******/
            if (!isWindFlow) {
                if (!isNeg) {
                    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(2021, 10, 11, 0))
                    viewer.clock.shouldAnimate = true
                    viewer.clock.multiplier = 86400
                } else {
                    if (!isUCT) {
                        viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(2021, 11, 1, 0))
                        viewer.clock.shouldAnimate = true
                        viewer.clock.multiplier = -86400
                    }
                }
            }
        } else {
            /******流场画点******* */
            console.log(this.windField.cgrid)
            for (let i = 0; i < this.windField.cgrid.length; i++) {
                for (let j = 0; j < this.windField.cgrid[0].length; j++) {
                    if (Array.isArray((this.windField.cgrid[i][j]))) {
                        if (this.windField.cgrid[i][j][0] !== 0 || this.windField.cgrid[i][j][1] !== 0) {
                            var instance = new Cesium.GeometryInstance({
                                geometry: new Cesium.RectangleGeometry({
                                    rectangle: Cesium.Rectangle.fromDegrees(
                                        j >= 181 ? j - 360 : j,
                                        90 - i - 1,
                                        j + 1 >= 181 ? j + 1 - 360 : j + 1,
                                        90 - i
                                    ),
                                    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
                                    height: 10000
                                }),
                                attributes: {
                                    color: new Cesium.ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 0.5)
                                }
                            });
                            viewer.scene.primitives.add(new Cesium.Primitive({
                                geometryInstances: [instance],
                                appearance: new Cesium.PerInstanceColorAppearance()
                            }));
                        }
                    }
                }
            }

        }
    },
    createField: function(i) {
        var data = this._parseWindJson(i);
        return new WindField(data);
    },
    animate: function() {
        //到点停止计时
        if (!isNeg && Cesium.JulianDate.toDate(viewer.clock.currentTime).getMonth() + '' + Cesium.JulianDate.toDate(viewer.clock.currentTime).getDate() === '111') {
            viewer.clock.shouldAnimate = false
        } else if (isNeg && Cesium.JulianDate.toDate(viewer.clock.currentTime).getMonth() + '' + Cesium.JulianDate.toDate(viewer.clock.currentTime).getDate() === '1010') {
            viewer.clock.shouldAnimate = false
        }
        var self = this,
            field = null,
            next = null,
            particles = self.particles;
        let instances = [],
            nextX = null,
            nextY = null,
            xy = null,
            uv = [],
            uvnow = null,
            uvnext = null;
        particles.forEach(function(particle) {
            /**********切换矢量场************/
            if (!isWindFlow && !particle.isDestroyed) {
                //最邻近插值
                /* if (particle.age === particleAge * 7 / 8) {
                    self.windField = fieldGroup[1]
                } else if (particle.age === particleAge * 5 / 8) {
                    self.windField = fieldGroup[2]
                } else if (particle.age === particleAge * 3 / 8) {
                    self.windField = fieldGroup[3]
                } else if (particle.age === particleAge * 1 / 8) {
                    self.windField = fieldGroup[4]
                } */
                //阶梯插值前临近
                /* if (particle.age === particleAge) {
                    self.windField = fieldGroup[0]
                } else if (particle.age === particleAge * 3 / 4) {
                    self.windField = fieldGroup[1]
                } else if (particle.age === particleAge * 2 / 4) {
                    self.windField = fieldGroup[2]
                } else if (particle.age === particleAge * 1 / 4) {
                    self.windField = fieldGroup[3]
                } */
                //线性插值
                if (particle.age === particleAge) {
                    self.windField = fieldGroup[0]
                    self.nextField = fieldGroup[1]
                    this.maxAge = particleAge, this.minAge = particleAge * 3 / 4;
                } else if (particle.age === particleAge * 3 / 4) {
                    self.windField = fieldGroup[1]
                    self.nextField = fieldGroup[2]
                    this.maxAge = particleAge * 3 / 4, this.minAge = particleAge * 2 / 4;
                } else if (particle.age === particleAge * 2 / 4) {
                    self.windField = fieldGroup[2]
                    self.nextField = fieldGroup[3]
                    this.maxAge = particleAge * 2 / 4, this.minAge = particleAge * 1 / 4;
                } else if (particle.age === particleAge * 1 / 4) {
                    self.windField = fieldGroup[3]
                    self.nextField = fieldGroup[4]
                    this.maxAge = particleAge * 1 / 4, this.minAge = 0;
                }
            }
            field = self.windField
            next = self.nextField
            if (!isWindFlow && !isRect && (
                    (
                        field.cgrid[Math.floor(particle.y)][Math.floor(particle.x)] &&
                        field.cgrid[Math.floor(particle.y)][Math.floor(particle.x)][0] === 0 &&
                        field.cgrid[Math.floor(particle.y)][Math.floor(particle.x)][1] === 0)
                )) {
                viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(2021, 11, 1, 0))
            }
            if (particle.isDestroyed) {

            } else if (isWindFlow && particle.age <= 0) {
                //风模拟计时结束
                rect = false
                particle.path.push(particle.x, 90 - particle.y)
                isWindFlow = false
                rectInstances.push(self._createLineInstance(particle.path));
                isWindFlow = true
                particle.isDestroyed = true;
            } else if (isWindFlow && particle.age > 0) {
                //风模拟
                var x = particle.x,
                    y = particle.y;
                if (!field.isInBound(x, y)) {
                    particle.age = 0;
                } else {
                    uv = field.getIn(x, y);
                    if (Math.abs(uv[0]) < 1e-9 && Math.abs(uv[1]) < 1e-9) {
                        particle.age = 0
                    }
                    /*********系数***********/
                    let yindex = 180 / (Math.PI * 6371 * 1000) //y方向上1m=?°
                    let xindex = 180 / (Math.PI * 6371 * 1000 * Math.cos(Math.abs(90 - y) * Math.PI / 180)) //x方向上1m=?°
                        //console.log(particle.age)
                    nextX = x - SPEED_RATE * 50 * uv[0] * xindex;
                    nextY = y - SPEED_RATE * 50 * uv[1] * yindex;
                    particle.path.push(nextX, 90 - nextY);
                    particle.x = nextX;
                    particle.y = nextY;
                    instances.push(self._createLineInstance(particle.path, particle.age / particle.birthAge, uv));
                    particle.age--;
                }
            } else if (!isWindFlow && (particle.age <= 0 ||
                    (particle.y >= 179 || particle.y < 0 || particle.x >= 359 || particle.x < 0) ||
                    (
                        field.cgrid[Math.floor(particle.y)][Math.floor(particle.x)] &&
                        field.cgrid[Math.floor(particle.y)][Math.floor(particle.x)][0] === 0 &&
                        field.cgrid[Math.floor(particle.y)][Math.floor(particle.x)][1] === 0)
                )) {
                //漂移粒子结束
                if (!isRect && !isUCT || isUCT && particle.UCT) {
                    if (isUCT && particle.UCT) {
                        if (particle.path.length > 2) {
                            //画点
                            var points = new Cesium.PointPrimitiveCollection();
                            for (let i = 0; i < particle.path.length; i += 200) {
                                points.add({
                                    color: Cesium.Color.YELLOW,
                                    pixelSize: 10,
                                    position: Cesium.Cartesian3.fromDegrees(particle.path[i], particle.path[i + 1]),
                                    disableDepthTestDistance: Number.POSITIVE_INFINITY, //永远禁用深度测试
                                    scaleByDistance: new Cesium.NearFarScalar(6e5, 1, 8.0e6, 0.0)
                                })
                            }
                            console.log(particle.x + ',' + particle.y)
                            _primitives.add(points)
                            instances.push(self._createLineInstance(particle.path));
                            self._drawLines(instances)
                        }
                    } else {
                        //console.log(particle.path[particle.path.length - 2], particle.path[particle.path.length - 1])
                        viewer.clock.shouldAnimate = false
                        alert('End!')
                            //画点
                        if (particle.path.length > 2) {
                            var points = new Cesium.PointPrimitiveCollection();
                            for (let i = 0; i < particle.path.length; i += particleAge / 50) {
                                points.add({
                                    color: Cesium.Color.YELLOW,
                                    pixelSize: 10,
                                    position: Cesium.Cartesian3.fromDegrees(particle.path[i], particle.path[i + 1]),
                                    disableDepthTestDistance: Number.POSITIVE_INFINITY, //永远禁用深度测试
                                    scaleByDistance: new Cesium.NearFarScalar(6e5, 1, 8.0e6, 0.0)
                                })
                            }
                            _primitives.add(points)
                            instances.push(self._createLineInstance(particle.path));
                            self._drawLines(instances)
                        }
                        viewer.camera.flyTo({
                            destination: Cesium.Cartesian3.fromDegrees(particle.path[0], particle.path[1] + 2, 1200000)
                        });
                        clearInterval(timer);
                    }
                } else {
                    if (isUCT) {
                        var greyPoints = new Cesium.PointPrimitiveCollection();
                        for (let i = 0; i < particle.path.length - 4; i += particleAge / 50) {
                            greyPoints.add({
                                color: Cesium.Color.GREY,
                                pixelSize: 4,
                                position: Cesium.Cartesian3.fromDegrees(particle.path[i], particle.path[i + 1]),
                                disableDepthTestDistance: Number.POSITIVE_INFINITY, //永远禁用深度测试
                                scaleByDistance: new Cesium.NearFarScalar(6e5, 1, 8.0e6, 0.0)
                            })
                        }
                        greyPoints.add({ //yellow
                            color: Cesium.Color.YELLOW,
                            pixelSize: 10,
                            position: Cesium.Cartesian3.fromDegrees(particle.path[particle.path.length - 2], particle.path[particle.path.length - 1]),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY, //永远禁用深度测试
                            scaleByDistance: new Cesium.NearFarScalar(6e5, 1, 8.0e6, 0.0)
                        })
                        console.log(particle.path[particle.path.length - 2] + ',' + particle.path[particle.path.length - 1])
                        _primitives.add(greyPoints)
                        particle.isDestroyed = true;
                    } else {
                        rect = false
                        particle.path.push(particle.x, 90 - particle.y)
                        rectInstances.push(self._createLineInstance(particle.path));
                        particle.isDestroyed = true;
                    }
                }
            } else if (!isWindFlow && particle.age > 0) {
                //漂移粒子继续
                var x = particle.x,
                    y = particle.y;
                if (!field.isInBound(x, y)) {
                    particle.age = 0;
                } else {
                    //最邻近、阶梯
                    //uv = field.getIn(x, y);
                    //线性插值
                    uvnow = field.getIn(x, y);
                    uvnext = next.getIn(x, y);
                    uv[0] = ((particle.age - this.minAge) / (particleAge / 4)) * uvnow[0] + ((this.maxAge - particle.age) / (particleAge / 4)) * uvnext[0]
                    uv[1] = ((particle.age - this.minAge) / (particleAge / 4)) * uvnow[1] + ((this.maxAge - particle.age) / (particleAge / 4)) * uvnext[1]
                    uv[2] = 1
                        //加速度模型+摩擦力
                    if (isAc) {
                        uv[0] = (uv[0] * acFactor + particle.uvPre[0]) * frictionFactor
                        uv[1] = (uv[1] * acFactor + particle.uvPre[1]) * frictionFactor
                    }
                    //console.log(uvnow, uvnext, uv, particle.age, this.minAge, this.maxAge)
                    particle.uvPre = uv.slice()
                    if (Math.abs(uv[0]) < 1e-9 && Math.abs(uv[1]) < 1e-9) {
                        particle.age = 0
                    }
                    /*********系数***********/
                    if (isUCT) {
                        uv[0] += (0.4 * Math.random()) - 0.2
                        uv[1] += (0.4 * Math.random()) - 0.2
                    }
                    let yindex = 180 / (Math.PI * 6371 * 1000) //y方向上1m=?°
                    let xindex = 180 / (Math.PI * 6371 * 1000 * Math.cos(Math.abs(90 - y) * Math.PI / 180)) //x方向上1m=?°
                    if (isNeg) {
                        nextX = x - SPEED_RATE * (uv[0]) * xindex;
                        nextY = y - SPEED_RATE * (uv[1]) * yindex;
                    } else {
                        nextX = x + SPEED_RATE * (uv[0]) * xindex;
                        nextY = y + SPEED_RATE * (uv[1]) * yindex;
                    }
                    particle.path.push(nextX, 90 - nextY);
                    self._changeIcons(particle);
                    particle.x = nextX;
                    particle.y = nextY;
                    particle.age--;
                    /* if (particle.age % 250 === 0) {
                        console.log(particle.path[particle.path.length - 2] + ',' + particle.path[particle.path.length - 1])
                    } */

                }
                if (!isRect) {
                    //单粒子跟踪
                    this.viewer.camera.setView({
                        destination: Cesium.Cartesian3.fromDegrees(particles[0].x, 90 - particles[0].y - 0.5, 20000), //-172,21//114.3540, 30.5270//84.4，28.6
                        orientation: {
                            heading: Cesium.Math.toRadians(0),
                            pitch: Cesium.Math.toRadians(-30),
                            roll: Cesium.Math.toRadians(0),
                        },
                    });
                }
            }
        });
        if (isRect && isWindFlow) {
            //风模拟绘制
            self._drawLines(instances)
        }
        if (isRect && rectInstances.length === PARTICLES_NUMBER) {
            //rect最终结果绘制
            if (isWindFlow) {
                isWindFlow = false;
                self._drawLines(rectInstances)
                isWindFlow = true;
            } else {
                viewer.clock.shouldAnimate = false
                viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date(2021, 11, 1, 0))
                alert('End!')
                clearInterval(timer);
                self._drawLines(rectInstances)
            }
        }
    },
    _parseWindJson: function(i) {
        var uComponent = null,
            vComponent = null,
            uCurrent = null,
            vCurrent = null,
            headerC = null,
            header = null;
        this.windData[i].forEach(function(record) {
            var type = record.header.parameterNumberName;
            switch (type) {
                case "U-component_of_wind":
                    uComponent = record['data'];
                    header = record['header'];
                    break;
                case "V-component_of_wind":
                    vComponent = record['data'];
                    break;
                case "U-component_of_current":
                    uCurrent = record['data'];
                    headerC = record['header'];
                    break;
                case "V-component_of_current":
                    vCurrent = record['data'];
                    break;
                default:
                    break;
            }
        });
        return {
            header: header,
            uComponent: uComponent,
            vComponent: vComponent,
            headerC: headerC,
            uCurrent: uCurrent,
            vCurrent: vCurrent,
        };
    },
    removeLines: function() {
        if (this.lines) {
            _primitives.remove(this.lines);
        }
    },
    removeAll: function() {
        this.particles = [];
        _primitives.removeAll();
    },
    //点转换经纬度
    _map: function(arr) {
        var length = arr.length,
            field = this.windField,
            dx = field.dx,
            dy = field.dy,
            west = field.west,
            south = field.north,
            newArr = [];
        for (var i = 0; i <= length - 2; i += 2) {
            newArr.push(
                west + arr[i] * dx,
                south - arr[i + 1] * dy
            )
        }
        return newArr;
    },
    _createLineInstance: function(positions, ageRate, uv1) {
        var colors = [],
            length = positions.length,
            count = length / 2;
        let max = this.windField.max,
            min = this.windField.min
        if (isWindFlow) {
            //风模拟绘制
            for (var i = 0; i < length; i++) {
                colors.push(
                    new Cesium.Color(1, 1, 0, i / count * ageRate * BRIGHTEN)
                );
            }
            return new Cesium.GeometryInstance({
                geometry: new Cesium.PolylineGeometry({
                    positions: Cesium.Cartesian3.fromDegreesArray(positions),
                    colors: colors,
                    width: 1,
                })
            });
        }
        return new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
                positions: Cesium.Cartesian3.fromDegreesArray(positions),
                width: 1,
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0))
            }
        });
    },
    _drawLines: function(lineInstances) {
        this.removeLines();
        var linePrimitive = new Cesium.Primitive({
            appearance: new Cesium.PolylineColorAppearance({
                translucent: true
            }),
            geometryInstances: lineInstances,
            asynchronous: false
        });
        this.lines = _primitives.add(linePrimitive);
    },
    _addIcons: function(particle) {
        if (!isUCT || particle.UCT) {
            particle.billboard = billboards.add({
                image: './pic/ship.ico',
                position: Cesium.Cartesian3.fromDegrees(...this.xy2lonlat(particle.x, particle.y), isRect ? 10000 : 1000)
            });
        }
    },
    _changeIcons: function(particle) {
        if (!isUCT || particle.UCT) {
            let len = particle.path.length
            particle.billboard.position = Cesium.Cartesian3.fromDegrees(
                particle.path[len - 2],
                particle.path[len - 1],
                isRect ? 10000 : 1000
            )
        }
    },
    xy2lonlat: function(x, y) {
        return [x >= 180 ? -(360 - x) : x, 90 - y]
    },
    randomParticle: function(particle, x1, y1, x2, y2) {
        var safe = 30,
            x, y;
        let x0, y0, r, thta
        if (!isRect) {
            x = +x1
            if (+x1 < 0) {
                x = 360 + (+x1)
            }
            y = Math.floor(90 - (+y1))
                /* x = 315.1098
                y = 90 - 34.0356 */
            if (isUCT) {
                if (!UCTFirst) {
                    //圆形随机
                    r = 0.2 * Math.random()
                    thta = 90 * Math.random()
                    xx = Math.cos(thta * Math.PI / 180) * r
                    yy = Math.sin(thta * Math.PI / 180) * r
                    if (Math.random() > 0.5) {
                        xx = -xx
                    }
                    if (Math.random() > 0.5) {
                        yy = -yy
                    }
                    x += xx
                    y += yy;
                    //方形随机
                    /* x += (-0.2 + Math.random() * 0.4)
                    y += (-0.2 + Math.random() * 0.4) */
                } else {
                    UCTFirst = false
                    particle.UCT = true
                }
            }
        } else {
            /* x = Math.round(x1 + Math.random() * (x2 - x1));
            y = Math.round(y1 + Math.random() * (y2 - y1)); */
            x0 = Math.floor((x1 + x2) / 2), y0 = Math.floor((y1 + y2) / 2)
            r = Math.random() * (y2 - y1) * Math.PI * 1000 * 6371 / 180
            thta = 90 * Math.random()
            xx = Math.cos(thta * Math.PI / 180) * r * 180 / (Math.PI * 6371 * 1000 * Math.cos(Math.abs(90 - y0) * Math.PI / 180))
            yy = Math.sin(thta * Math.PI / 180) * r * 180 / (Math.PI * 1000 * 6371)
            if (Math.random() > 0.5) {
                xx = -xx
            }
            if (Math.random() > 0.5) {
                yy = -yy
            }
            x = x0 + xx
            y = y0 + yy
        }
        /* x = Math.floor(Math.random() * (this.windField.cols - 2));
        y = Math.floor(Math.random() * (this.windField.rows - 2)); */
        x = 315.1098
        y = 90 - 34.0356 //定制粒子位置
        particle.x = x;
        particle.y = y;
        if (!isWindFlow) {
            particle.age = particleAge
        } else {
            particle.age = 250
        }
        particle.birthAge = particle.age;
        particle.path = [x, 90 - y];
        console.log(particle.path[0] + ',' + particle.path[1])
        particle.isDestroyed = false;
        return particle;
    }
};