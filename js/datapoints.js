import {
  GlobeKitView, PointGlobe, Atmosphere, CalloutManager, CalloutDefinition, Icosphere, ShaderMaterial
} from '../globekit.esm.js';
import { POIPinCallout } from './POIPinCallout.js';
import { POIDetailCallout } from './POIDetailCallout.js';

// Api Key from your GlobeKit account
const apiKey = 'gk_c0587bdb316371eb21f8f40e4bd50b6482b375cc1988e49c40aa96dfd5e4fb763924d6ddce235bb10629fd419017d177bdd27cd6766606a0b92f6801673433f4';

// Texture object for PointGlobe sparkle/shimmer
const textures = {
  // Clouds.png is availible in assets folder
  noise: './assets/clouds.png',
};

// Makes a random geojson object of count length. This should be replaced with a geojson asset load
// const generateRandomGeoJson = (count) => {
//   const geojson = {
//     type: 'FeatureCollection',
//     features: [],
//   };
//
//   for (let i = 0; i < count; i += 1) {
//     const feature = {
//       type: 'Feature',
//       properties: {
//
//       },
//       geometry: {
//         type: 'Point',
//         coordinates: [],
//       },
//     };
//
//     const lat = Math.random() * 180 - 90;
//     const lon = Math.random() * 360 - 180;
//     // Geojson records longitude first, this is a common gotcha
//     feature.geometry.coordinates = [lon, lat];
//
//     // Geojson properties are the catchall for any data values
//     feature.properties.mythicalCreatureSightings = Math.floor(Math.random() * 30);
//
//     geojson.features.push(feature);
//   }
//
//   return geojson;
// };
//
// // Generate some random Geojson
// const randomGeojson = generateRandomGeoJson(10000);

class MyGlobeKit {
  constructor(canvas, calloutContainer) {
    /**
     * gkOptions setup some base settings in GlobeKit
     * note: the apiKey and wasmPath settings
     */

    this.gkOptions = {
      apiKey,
      wasmPath: '../gkweb_bg.wasm',
      // attributes: {
      //   alpha: false,
      // },
      antialias: true,
      depth: true,
      premultipliedAlpha: false,
      powerPreferance: "default",
      preserveDrawingBuffer: true,
      clearColor: [0, 0, 0, 0],
    };

    // Create the GlobeKitView object
    this.gkview = new GlobeKitView(canvas, this.gkOptions);
    this.gkview.ambientController.longitudeSpeed = 0; //rotation speed
    this.gkview.ambientController.latitudeSpeed = 0; //rotation speed

    // **********************************************************************
    //                   CALLOUTMANAGER
    // **********************************************************************
    // Callout manager moves callouts to keep them attached to their points
    this.calloutManager = new CalloutManager(calloutContainer);
    this.gkview.registerCalloutManager(this.calloutManager);

    // This gets called when the calloutManager removes a callout, i.e. when it rotates behind the globe.
    // this.calloutManager.shouldAutoRemoveCallout = (def) => {
    //   if (def.calloutClass === POIPinCallout) {
    //     return false;
    //   }
    //   return true;
    // };
    //

    // DOM onClick callback
    // this.onPinClick = this.onPinClick.bind(this);
    // calloutContainer.addEventListener('pinclick', this.onPinClick);



    // **********************************************************************
    //                   ONSELECTION
    // **********************************************************************
    // onSelection gets called when the globe reports a selection event
    this.gkview.onSelection = (list) => {
      // Uncomment this line to see the list object
      // console.log(list);

      // Iterate over the drawables that reported a selection
      list.drawables.forEach((el) => {
        // This gets run if the points object is selected
        if (el.obj.id === this.pointglobe.id) {
          // Check that selection is valid
          if (el.selection !== undefined) {
            // Create a ripple at the location with duration of 3 seconds
            this.pointglobe.rippleAtLocation(el.selection.lat, el.selection.lon, 3000);
          }
        } else if (el.obj.id === this.points.id) {
          if (el.selection !== undefined) {
            // Do something with selected point
          }
        }
      });
    };

    // this.gkview.hitTest = (e) => {
    //   console.log(e, 55)
    // }

    // **********************************************************************
    //                   BACKGROUNDS
    // **********************************************************************
    // Backgrounds provide more control over the look of the rendered scene
    // They require a texture image source
    // this.background = new Background('../assets/star.jpg');
    // console.log(this.background, 'bg')
    // // Adding this drawable first ensures that it is drawn first.
    // this.gkview.addDrawable(this.background);

    // **********************************************************************
    //                   ATMOSPHERES
    // **********************************************************************
    // this.atmosphere = new Atmosphere({
    //   texture: './assets/disk.png',
    // });
    // this.atmosphere.nScale = 1.02;
    // this.atmosphere.isInteractive = true;
    // this.gkview.addDrawable(this.atmosphere);

    // **********************************************************************
    //                   ICOSPHERE
    // **********************************************************************
    this.icosphere = new Icosphere('../assets/bg.png');
    // You should not have to touch this.
    // this.icosphere.setInteractive(true, true, false);
    this.gkview.addDrawable(this.icosphere, () => {
      this.gkview.startDrawing();
    });

    // **********************************************************************
    //                   POINTGLOBE
    // **********************************************************************
    // Load the binary from static server
    fetch('./assets/pointglobe.bin')
      .then((res) => res.arrayBuffer())
      .then((data) => {
        // Some pointglobe settings
        const pointglobeParams = {
          pointSize: 0.009,
          randomPointSizeVariance: 0.009,
          randomPointSizeRatio: 0.2,
          minPointAlpha: 0.2,
          minPointSize: 0.009,
          color: '#AF5BEA',
        };
        this.pointglobe = new PointGlobe(textures, data, pointglobeParams);
        console.log(this.pointglobe, 5)
        this.pointglobe.setInteractive(true, true, false);
      })
      .then(() => {
        // Add the drawable, start drawing when it finishes
        this.gkview.addDrawable(this.pointglobe, () => {
          this.gkview.startDrawing();
        });
      });

    // **********************************************************************
    //                   PINS
    // **********************************************************************
    this.pinDefs = [];
    fetch('../data/menus.json')
        .then((response) => response.json())
        .then((data) => {
          this.pinDefs = data.features.map((el) => {
            // const lat = el.geometry.coordinates[1];
            // const lon = el.geometry.coordinates[0];
            // return new CalloutDefinition(lat, lon, POIPinCallout, el.properties);

            const lat = el.geometry.coordinates[1];
            const lon = el.geometry.coordinates[0];
            const data = el.properties;
            return new CalloutDefinition(lat, lon, POIDetailCallout, data);
          });
          this.calloutManager.replaceCallouts(this.pinDefs);
          // this.calloutManager.replaceCallouts(this.pinDefs);
        });

    // If clicking on the globe surface, deselect current
    this.gkview.onTap = () => {
      this.selectedDetailDef = null;
      this.calloutManager.replaceCallouts(this.pinDefs);
    };
  }
  // Pin click callback
  // onPinClick(e) {
  //   console.log(e, 'e')
  //   const lat = e.detail.latitude;
  //   const lon = e.detail.longitude;
  //   const data = e.detail.data;
  //   this.selectedDetailDef = new CalloutDefinition(lat, lon, POIDetailCallout, data);
  //   this.calloutManager.replaceCallouts([...this.pinDefs, this.selectedDetailDef]);
  // }
}

export { MyGlobeKit };
  