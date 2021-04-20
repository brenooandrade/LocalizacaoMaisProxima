'use strict';

async function CalculaGeoCode(OrigLat, OrigLon, DestLat, DestLon) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((DestLat - OrigLat) * p)/2 + 
          c(OrigLat * p) * c(DestLat * p) * 
          (1 - c((DestLon - OrigLon) * p))/2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

async function leituraGeoCode(vListaLocais, latOrig, longOrig){
  return new Promise(async (resolve, reject) => {
     try {
        if (vListaLocais.Unidades.length <= 0) 
           reject('Não há itens na lista');
        for (let i in vListaLocais.Unidades) {
           let Distancia = await CalculaGeoCode(latOrig, longOrig, vListaLocais.Unidades[i].Latitude, vListaLocais.Unidades[i].Longitude); 
           vListaLocais.Unidades[i].Distancia = Distancia;      
        }
        resolve(vListaLocais.Unidades);
     } catch (error) {
        reject(error);
     }
  });
}

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return (function (a,b) {
        /* next line works with strings and numbers, 
        * and you may want to customize it to your needs
        */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    })
}

async function Ordenar(vListaLocais) {
  return new Promise(async (resolve, reject) => {
    try {
      var vLocalProximo = {};
      await new Promise((resolve, reject) => {
        vLocalProximo =  vListaLocais.sort(dynamicSort("Distancia"));
        resolve(); 
      });         
      resolve(vLocalProximo);
    } catch (error) {
      reject(error);
    }
  }); 
}

module.exports.geoCodeDistancia = async (event, context, callback) => {
  try {
    var vListaOrigem   = JSON.parse(event.body);
    var geoCodeCliente = event.pathParameters;

    var vLocalMaisProx = await leituraGeoCode(vListaOrigem, geoCodeCliente.latitude, geoCodeCliente.longitude);
    vLocalMaisProx     = await Ordenar(vLocalMaisProx);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
      },
      body: JSON.stringify(
        {
          sucesso: true,
          message: 'Sucesso ao executar função.',
          dados: vLocalMaisProx,
        })
      };
  } catch(error) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
      },
      body: JSON.stringify(
        {
          code: "BadRequest",
          parametros: event.pathParameters,
          body: event.body,
          sucesso: false,
          message: `Erro ao executar função: ${error}`
        })
      };
  }  


};
