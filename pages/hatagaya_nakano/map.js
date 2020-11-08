let l_svg;
async function f_map(a_file, a_zoom_level, a_x_left_16, a_y_top_16, a_x_width_16, a_y_height_16){ //非同期処理のためasyncをつけている。
	console.log(a_file);
	console.log("start");
	const c_geojson = JSON.parse((await f_xhr_get(a_file)).responseText);
	console.log("end");
	console.log(c_geojson);
	
	
	//ズームレベルa_zoom_levelでのタイルマップのxyに変換する。
	//経度の基準を半分ずらしている。
	const c_zoom_level = a_zoom_level;
	const c_dx = (2 ** c_zoom_level) * 256 / 2;//左端（緯度の基準は半分の位置）
	const c_dy = 0;//上端
	
	const c_x_left_16 = a_x_left_16;//上端タイル番号16
	const c_y_top_16 = a_y_top_16;//左端タイル番号16
	const c_x_width_16 = a_x_width_16;//横タイル数16
	const c_y_height_16 = a_y_height_16;//縦タイル数16
	
	const c_x_left_tile = c_x_left_16  * (2 ** (c_zoom_level - 16));
	const c_y_top_tile = c_y_top_16 * (2 ** (c_zoom_level - 16));
	const c_x_width_tile = c_x_width_16  * (2 ** (c_zoom_level - 16));
	const c_y_height_tile = c_y_height_16 * (2 ** (c_zoom_level - 16));
	
	const c_x_left = c_x_left_16 * 256 * (2 ** (c_zoom_level - 16));
	const c_y_top = c_y_top_16 * 256 * (2 ** (c_zoom_level - 16));
	const c_x_width = c_x_width_16 * 256 * (2 ** (c_zoom_level - 16));
	const c_y_height = c_y_height_16 * 256 * (2 ** (c_zoom_level - 16));
	
	
	
	for (let i1 = 0; i1 < c_geojson["features"].length; i1++) {
		if (c_geojson["features"][i1]["geometry"]["type"] === "LineString") {
			const c_coordinates = c_geojson["features"][i1]["geometry"]["coordinates"];
			const c_xy = [];
			for (let i2 = 0; i2 < c_coordinates.length; i2++) {
				const c_lon = c_coordinates[i2][0];
				const c_lat = c_coordinates[i2][1];
				c_xy.push({
					"x": 2 ** (c_zoom_level + 7) * (c_lon / 180 + 1) - c_x_left
					, "y": 2 ** (c_zoom_level + 7) / Math.PI * ((-1) * Math.atanh(Math.sin(c_lat * Math.PI / 180)) + Math.atanh(Math.sin(85.05112878 * Math.PI / 180))) - c_y_top
				});
			}
			c_geojson["features"][i1]["geometry"]["xy"] = c_xy;
		}
	}
	
	l_svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"" + c_x_width + "\" height=\"" + c_y_height + "\" viewBox=\"0 0 " + c_x_width + " " + c_y_height + "\">";
	l_svg += "\n<g style=\"opacity: 0.5;\">";
	for (let i1 = 0; i1 < c_x_width_tile; i1++) {
		for (let i2 = 0; i2 < c_y_height_tile; i2++) {
			l_svg += "\n<image xlink:href=\"https://cyberjapandata.gsi.go.jp/xyz/pale/" + String(c_zoom_level) + "/" + String(c_x_left_tile + i1) + "/" + String(c_y_top_tile + i2) + ".png\" x=\"" + String(i1 * 256) + "\" y=\"" + String(i2 * 256) + "\" width=\"256\" height=\"256\" />";
		}
	}
	l_svg += "\n</g>";
	
	
	
	l_svg += "\n<g style=\"fill: none; stroke: #000000; stroke-width: 2px;\">";
	for (let i1 = 0; i1 < c_geojson["features"].length; i1++) {
		if (c_geojson["features"][i1]["geometry"]["type"] === "LineString") {
			const c_date = c_geojson["features"][i1]["properties"]["date"].split("-");
			l_svg += "\n<polyline points=\"";
			const c_xy = c_geojson["features"][i1]["geometry"]["xy"];
			for (let i2 = 0; i2 < c_xy.length; i2++) {
				if (i2 !== 0) {
					l_svg += " ";
				}
				l_svg += String(c_xy[i2]["x"]) + " " + String(c_xy[i2]["y"]);
			}
			l_svg += "\" />";
		}
	}
	l_svg += "\n</g>";
	
	
	
	l_svg += "\n<g style=\"fill: #000000; stroke: none; font-family: IPAmjMincho; font-size: 16px;\">";
	for (let i1 = 0; i1 < c_geojson["features"].length; i1++) {
		l_svg += "\n<text x=\"" + c_geojson["features"][i1]["geometry"]["xy"][0]["x"] + "\" y=\"" + c_geojson["features"][i1]["geometry"]["xy"][0]["y"] + "\">" + c_geojson["features"][i1]["properties"]["start"] + "</text>";
		l_svg += "\n<text x=\"" + c_geojson["features"][i1]["geometry"]["xy"][Math.round(c_geojson["features"][i1]["geometry"]["xy"].length / 2)]["x"] + "\" y=\"" + c_geojson["features"][i1]["geometry"]["xy"][Math.round(c_geojson["features"][i1]["geometry"]["xy"].length / 2)]["y"] + "\">" + "</text>";
		l_svg += "\n<text x=\"" + c_geojson["features"][i1]["geometry"]["xy"][c_geojson["features"][i1]["geometry"]["xy"].length - 1]["x"] + "\" y=\"" + c_geojson["features"][i1]["geometry"]["xy"][c_geojson["features"][i1]["geometry"]["xy"].length - 1]["y"] + "\">" + c_geojson["features"][i1]["properties"]["end"] + "</text>";
	}
	l_svg += "\n</g>";
	
	l_svg += "\n</svg>";
	console.log(l_svg);	
	return l_svg;
	

}

function f_xhr_get(a_url) {
	//非同期処理の順のためPromiseを使う。
	function f_promise(a_resolve, a_reject) {
		const c_xhr = new XMLHttpRequest();
		c_xhr.open("get", a_url);
		function f_resolve() {
			a_resolve(c_xhr);
		}
		c_xhr.onload = f_resolve;
		c_xhr.onerror = f_resolve;
		c_xhr.send(null);
	}
	return new Promise(f_promise);
}
