// number of imgaes processed by the optical flow
N_IMG_SOF = 2

function convertVidToImg(input){
	if (input.files && input.files[0]){
		file = input.files[0];
		if (file.type.startsWith("video")){
			var reader = new FileReader();
			reader.onload = function(e) {
				var videoData = {
					[file.name] : e.target.result
				};
				$.ajax({
					type: 'POST',
					url: 'http://127.0.0.1:5000/convert_video',
					data: JSON.stringify(videoData),
					success: alert("Video converted!"),
					contentType: 'application/json',
					dataType: 'json',
					async: false
				})
			}
			reader.readAsDataURL(file);
			
		}
	}
}

function displayImage(){
	$('#img').attr('src', imagesData[imageNames[currentImgPtr]].data)
	$('#img').attr('label', imageNames[currentImgPtr])
}

function storeBboxes(data){
	boxes = data['boxes']
			for (var imgName in boxes) {
				imgBoxes = {'boxes': boxes[imgName]}
				images[imgName] = imgBoxes;
			}
}

//computes bounding box of one image using a ConvNet
function computeBboxesConvNet(){
	image = imagesData[imageNames[currentImgPtr]]
	requestParam = {[image.name]: image.data}
	$.ajax({
		type: 'POST',
		url: 'http://127.0.0.1:5000/bboxes_convnet',
		data: requestParam,
		success: storeBboxes,
		async:false
	})
}

// computes bounding box for many images using Semantic Optical Flow
function computeBboxesOpticalFlow(){
	sofImageNames = imageNames.slice(currentImgPtr, currentImgPtr + N_IMG_SOF + 1);
	sofImages = {}
	for (var i=0; i < sofImageNames.length; i++){
		imgName = sofImageNames[i];
		image = imagesData[imgName];
		sofImages[image.name] = image.data;
	}
	
	requestParam = {'bbox': {[imageNames[currentImgPtr]] :images[imageNames[currentImgPtr]]['boxes']},
					'images': sofImages};
					
	$.ajax({
		type: 'POST',
		url: 'http://127.0.0.1:5000/bboxes_sof',
		data: JSON.stringify(requestParam),
		success: storeBboxes,
		contentType: 'application/json',
		dataType: 'json',
		async:false
	})
	
	
}

$('#nextImgBtn').on('click', function(){
	if (currentImgPtr + N_IMG_SOF + 1 >= imageNames.length){
		alert("Not enough images to calculate optical flow!")
	}
	else{
		computeBboxesOpticalFlow();
		currentImgPtr += 1 + N_IMG_SOF;
		computeBboxesConvNet();
		displayImage();
	}
});

$('#prevImgBtn').on('click', function(){
	if (currentImgPtr /*- N_IMG_SOF */ - 1 < 0){
		alert("You are looking at the first image!");
	}
	else {
		currentImgPtr -= 1 /*+ N_IMG_SOF*/;
		displayImage();
	}
});

$('#startProcessBtn').on('click', function(){
	if (imageNames.length == 0){
		alert("No images loaded!");
	}
	else {
	// sort the imageNames because the filereader works asynchronously
	imageNames.sort();
	currentImgPtr = 0;
	computeBboxesConvNet();
	displayImage();
	$('#prevImgBtn').attr('disabled', false)
	$('#nextImgBtn').attr('disabled', false)
	}
});



