var WindField = function(obj) {
    this.west = null;
    this.east = null;
    this.south = null;
    this.north = null;
    this.rows = null;
    this.cols = null;
    this.dx = null;
    this.dy = null;
    this.unit = null;
    this.date = null;
    this.grid = null;
    this.wgrid = null;
    this.cgrid = null;
    this.min = +Infinity;
    this.max = -Infinity;
    this._init(obj);
};

WindField.prototype = {
    constructor: WindField,
    _init: function(obj) {
        var header = obj.header,
            uComponent = obj['uComponent'],
            vComponent = obj['vComponent'],
            uCurrent = obj['uCurrent'],
            vCurrent = obj['vCurrent'];
        this.west = +header['lo1'];
        this.east = +header['lo2'];
        this.south = +header['la2'];
        this.north = +header['la1'];
        this.rows = +header['ny'];
        this.cols = +header['nx'];
        this.dx = +header['dx'];
        this.dy = +header['dy'];
        this.unit = header['parameterUnit'];
        this.date = header['refTime'];
        this.grid = [];
        this.wgrid = [];
        var k = 0,
            rows = null,
            wrows = null,
            uv = null;
        wuv = null;
        /***********压风场*************/
        for (var j = 0; j < this.rows; j++) {
            rows = [];
            wrows = [];
            for (var i = 0; i < this.cols; i++, k++) {
                uv = this._calcUV((+uComponent[k]), (+vComponent[k]));
                wuv = this._calcUV((+uComponent[k]), (+vComponent[k]));
                this.min = Math.min(this.min, uv[2]);
                this.max = Math.max(this.max, uv[2]);
                rows.push(uv);
                wrows.push(wuv);
            }
            this.grid.push(rows);
            this.wgrid.push(wrows);
        }
        //this.wgrid.reverse()
        /* for (var j = 0; j < this.rows; j++) {
            this.wgrid[j] = this.wgrid[j].slice(180).concat(this.wgrid[j].slice(0, 180))
        } */
        k = 0;
        /************压流场OSCAR************/
        /* this.cgrid = [];
        for (let i = 0; i < 140; i += 1) {
            let temp = []
            for (let j = 0; j < 360; j += 1, k += 1) {
                temp.push([+uCurrent[k], +vCurrent[k]])
            }
            this.cgrid.push(temp)
        }

        for (let i = 0; i < 21; i++) {
            this.cgrid.push(new Array(360).fill(false))
        }
        for (let i = 0; i < 20; i++) {
            this.cgrid.unshift(new Array(360).fill(false))
        }
        this.cgrid = this.cgrid.reverse()
        for (let i = 20; i < 160; i++) {
            this.cgrid[i] = this.cgrid[i].slice(360 - 20).concat(this.cgrid[i].slice(0, 360 - 20))
        } */
        /************压流场HYCOM************/
        this.cgrid = [];
        for (let i = 0; i < 171; i += 1) {
            let temp = []
            for (let j = 0; j < 360; j += 1, k += 1) {
                temp.push([+uCurrent[k], +vCurrent[k]])
            }
            this.cgrid.push(temp)
        }
        for (let i = 0; i < 10; i++) {
            this.cgrid.push(new Array(360).fill(false))
        }
        /***************集成矢量场****************/
        for (let i = 0; i < 181; i++) {
            for (let j = 0; j < 360; j++) {
                let c0, c1
                if (!this.cgrid[i][j]) {
                    c0 = 0
                    c1 = 0
                } else {
                    c0 = this.cgrid[i][j][0]
                    c1 = this.cgrid[i][j][1]
                }
                this.grid[i][j][0] = this.wgrid[i][j][0] * 0.05 + c0
                this.grid[i][j][1] = this.wgrid[i][j][1] * 0.05 + c1
                this.grid[i][j][2] = Math.sqrt(this.grid[i][j][0] * this.grid[i][j][0] + this.grid[i][j][1] * this.grid[i][j][1])
            }
        }
    },
    _calcUV: function(u, v) {
        return [+u, +v, Math.sqrt(u * u + v * v)];
    },
    //双线性插值
    _bilinearInterpolation: function(x, y, g00, g10, g01, g11) {
        var rx = (1 - x);
        var ry = (1 - y);
        var a = rx * ry,
            b = x * ry,
            c = rx * y,
            d = x * y;
        var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
        var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
        return this._calcUV(u, v);
    },
    //最邻近插值
    _nearestInterpolation: function(x, y, x0, y0, x1, y1, g00, g10, g01, g11) {
        let c00 = (x - x0) * (x - x0) + (y - y0) * (y - y0),
            c10 = (x - x1) * (x - x1) + (y - y0) * (y - y0),
            c01 = (x - x0) * (x - x0) + (y - y1) * (y - y1),
            c11 = (x - x1) * (x - x1) + (y - y1) * (y - y1)
        let min = Math.min(c00, c10, c01, c11),
            g
        switch (min) {
            case c00:
                g = g00
                break
            case c10:
                g = g10
                break
            case c01:
                g = g01
                break
            case c11:
                g = g11
                break
        }
        return this._calcUV(g[0], g[1])
    },
    getIn: function(x, y) {
        var x0 = Math.floor(x),
            y0 = Math.floor(y),
            x1, y1;
        if (x0 === x && y0 === y) {
            if (isWindFlow) {
                return this.wgrid[y][x];
            } else {
                return this.grid[y][x];
            }
        }
        x1 = x0 + 1;
        y1 = y0 + 1;
        var g00 = this.getIn(x0, y0),
            g10 = this.getIn(x1, y0),
            g01 = this.getIn(x0, y1),
            g11 = this.getIn(x1, y1);
        //return this._nearestInterpolation(x, y, x0, y0, x1, y1, g00, g10, g01, g11); //最邻近
        return this._bilinearInterpolation(x - x0, y - y0, g00, g10, g01, g11);
    },
    isInBound: function(x, y) {
        if ((x >= 0 && x < this.cols - 2) && (y >= 0 && y < this.rows - 2)) return true;
        return false;
    }
};