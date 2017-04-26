---
categories:
- computervision
- opencv
- python
- programming
- howto
comments: true
date: 2013-01-20T00:00:00Z
title: Extract array of frames from mp4 using Python OpenCV bindings
url: /blog/2013/01/20/extract-array-of-frames-from-mp4-using-python-opencv-bindings/
---

OpenCV is a mature Computer Vision library written in C++. There are python bindings available that make working with the library very convenient.

To extract the frames from an mp4 file using the Python OpenCV bindings, you first need python, and the `pip` package manager for python.

Also, you will need a system package manager such as Portage for Gentoo Linux or Homebrew for Mac OS X. You will need to compile OpenCV with your specific python version, for this example I am using python 2.7, you can find out which version you have by running `python --version`. This example will use Mac OS X 10.8.

## Install ffmpeg
```
brew install ffmpeg
```

## Build OpenCV with Python2.7 and ffmpeg
```
brew install opencv --python27 --ffmpeg
```

I am taking the [Coursera Image and Video processing](https://www.coursera.org/course/images) class right now, the example file I am using is one of [the lectures](https://class.coursera.org/images-2012-001/lecture/download.mp4?lecture_id=7), I saved the file as `course-logistics.mp4`.

To use OpenCV in python, you need to import cv2:

``` python
import cv2
```

Then, to open the video file:

``` python
vidcap = cv2.VideoCapture('course-logistics.mp4')
```

The easiest way to extract frames is to use the `read()` method on the vidcap object. It returns a [tuple](http://docs.python.org/2/tutorial/datastructures.html#tuples-and-sequences) where the first element is a success flag and the second is the image array. To extract the image array: 

``` python
success,image = vidcap.read()
# image is an array of array of [R,G,B] values
```

To convert the whole video to frames and save each one:

``` python
count = 0; 
while success:
	success,image = vidcap.read()
	cv2.imwrite("frame%d.jpg" % count, image)     # save frame as JPEG file
	if cv2.waitKey(10) == 27:                     # exit if Escape is hit
    	break
	count += 1
```

The above loop runs until `success` is false or the user hits the Escape key. Each iteration saves the current frame as a JPEG.

This is one way to extract a sequence of frames from a movie. Another way would be to change the body of the above while loop to do something else.