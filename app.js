var Realm = require('realm')
var fs = require("fs")

const Location = {
	name: 'Location',
	properties: {
		timestamp: 'int',
		longitude: 'double',
		latitude: 'double',
		speed: 'double'
	}
}

const HeartRate = {
	name: 'HeartRate',
	properties: {
		timestamp: 'int',
		value: 'int',
		sensorContactStatus: 'int',
		energyExpanded: 'int',
		rrIntervals: 'string'
	}
}

const StepModel = {
	name: 'StepModel',
	primaryKey: 'timestamp',
	properties: {
		timestamp: 'int',
		speed: 'double',
		cadence: 'int',
		strideLength: 'double',
		totalDistance: 'double'
	}
}

const Pedometers = {
	name: 'Pedometers',
	properties: {
		timestamp: 'int',
		curSteps: 'int'
	}
}

const RunRecord = {
	name: 'RunRecord',
	primaryKey: 'startTime',
	properties: {
		startTime: 'int',
		duration: 'int',
		distance: 'double',
		usable: 'bool',
		isSync: 'bool',
		locations: { type: 'list', objectType: 'Location' },
		heartRates: { type: 'list', objectType: 'HeartRate' },
		steps: { type: 'list', objectType: 'StepModel' },
		pedometers: { type: 'list', objectType: 'Pedometers'}
	}
}

const resultPath = './result'

// 删除Result文件夹
function deleteall(path) {   
    if(fs.existsSync(path)) {  
        files = fs.readdirSync(path) 
        files.forEach(function(file, index) {  
            var curPath = path + "/" + file;  
            if(fs.statSync(curPath).isDirectory()) {  
                deleteall(curPath);  
            } else {  
                fs.unlinkSync(curPath);  
            }  
        }) 
        fs.rmdirSync(path);  
    }  
}
deleteall(resultPath) 

// 创建跑步文件夹
fs.mkdirSync(resultPath)
fs.mkdirSync(resultPath + '/run')

//查询db文件夹中的数据库文件【realm数据库必须带三个文件, 不然权限会有问题】
var realm_name = ''
if(fs.existsSync('./db')) {  
    files = fs.readdirSync('./db') 
    files.forEach(function(file, index) {  
    	var file_name=file.replace(/(.*\/)*([^.]+).*/ig,"$2")
    	realm_name = file_name
    })
    console.log(realm_name)
}

let realm = new Realm({schemaVersion:999, 
								path: './db/' + realm_name + '.realm', 
								schema: [RunRecord, Location, HeartRate, StepModel, Pedometers]})

let objs = realm.objects('RunRecord').sorted('startTime')

function timeToString(time) {
	var d = new Date(time * 1000)
	return d.toLocaleString()
}

objs.forEach(function(obj) {
	var dateStr = timeToString(obj.startTime)
	// 创建时间文件夹
	fs.mkdirSync(resultPath + '/run/' + dateStr)

	var fileBasePath = resultPath + '/run/' + dateStr +'/'

	// 写入跑步统计文件
	fs.writeFileSync(fileBasePath + 'run.txt', 
		'duration\t\tdistance' + '\n' + obj.duration + '\t\t' + obj.distance)

	// 写入location文件
	var locationStr = 'time\t\t\tlongitude\t\t\tlatitude\t\t\tspeed\n'
	obj.locations.forEach(function(location) {
		locationStr = locationStr + '\n' + timeToString(location.timestamp) + '\t\t' + location.longitude + '\t\t' + location.latitude + '\t\t' + location.speed
	})
	fs.writeFileSync(fileBasePath + 'location.txt', locationStr)

	// 写入heart rate文件
	var hrStr = 'time\t\t\t\tvalue\n'
	obj.heartRates.forEach(function(hr) {
		hrStr = hrStr + '\n' + timeToString(hr.timestamp) + '\t\t' + hr.value
	})
	fs.writeFileSync(fileBasePath + 'heartRate.txt', hrStr)

	// 写入步幅文件
	var stepStr = 'time\t\tspeed\t\tcadence\t\tstrideLength\t\tdistance\n'
	obj.steps.forEach(function(step) {
		stepStr = stepStr + '\n' + timeToString(step.timestamp) + '\t' + step.speed + '\t' + step.cadence + '\t' + step.strideLength + '\t' + step.totalDistance
	})
	fs.writeFileSync(fileBasePath + 'step.txt', stepStr)

	// 写入步数信息
	var pedometerStr = 'time\t\t\tstepCount\n'
	obj.pedometers.forEach(function(pedometer) {
		pedometerStr = pedometerStr + '\n' + timeToString(pedometer.timestamp) + '\t' + pedometer.curSteps
	})
	fs.writeFileSync(fileBasePath + 'pedometer.txt', pedometerStr)
})

realm.close()
// 清空db文件夹  
function deleteFiles(path) {   
    if(fs.existsSync(path)) {  
        files = fs.readdirSync(path) 
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;  
            if(fs.statSync(curPath).isDirectory()) {  
                deleteall(curPath);
            } else {
                fs.unlinkSync(curPath); 
            }  
        }) 
    }
}
deleteFiles('./db') 
console.log('Finish')
