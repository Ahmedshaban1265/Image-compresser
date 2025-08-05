import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Upload, Download, Image as ImageIcon, Folder, Zap, BarChart3, Eye, Settings } from 'lucide-react'
import './App.css'

function App() {
  const [files, setFiles] = useState([])
  const [compressedFiles, setCompressedFiles] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [compressionLevel, setCompressionLevel] = useState([80])
  const [outputFormat, setOutputFormat] = useState('jpeg')
  const [stats, setStats] = useState({ originalSize: 0, compressedSize: 0, savings: 0 })

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      size: file.size,
      name: file.name
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif', '.bmp']
    },
    multiple: true
  })

  const compressImages = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setProgress(0)
    setCompressedFiles([])

    const formData = new FormData()
    files.forEach(fileObj => {
      formData.append('images', fileObj.file)
    })
    formData.append('quality', compressionLevel[0])
    formData.append('format', outputFormat)

    try {
      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setProgress(percentCompleted)
        }
      })

      if (response.ok) {
        const result = await response.json()
        setCompressedFiles(result.files)
        setStats(result.stats)
        setProgress(100)
      } else {
        console.error('Compression failed')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadFile = async (fileId) => {
    try {
      const response = await fetch(`/api/download/${fileId}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `compressed_${fileId}.${outputFormat}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const downloadAll = async () => {
    try {
      const response = await fetch('/api/download-all')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'compressed_images.zip'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download all failed:', error)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const clearFiles = () => {
    setFiles([])
    setCompressedFiles([])
    setStats({ originalSize: 0, compressedSize: 0, savings: 0 })
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Image Compressor</h1>
          <p className="text-lg text-gray-600">Compress your images while maintaining high quality</p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive ? 'Drop the images here...' : 'Drag and drop images or click to select'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports JPEG, PNG, WebP, GIF, BMP
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.webkitdirectory = true;
                        input.multiple = true;
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const files = Array.from(e.target.files);
                          const imageFiles = files.filter(file => file.type.startsWith('image/'));
                          onDrop(imageFiles);
                        };
                        input.click();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Folder className="w-4 h-4" />
                      Select Folder
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Compression Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Level: {compressionLevel[0]}%
                  </label>
                  <Slider
                    value={compressionLevel}
                    onValueChange={setCompressionLevel}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files Preview */}
        {files.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Selected Images ({files.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={compressImages} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
                  <Zap className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Compressing...' : 'Compress Images'}
                </Button>
                <Button variant="outline" onClick={clearFiles}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isProcessing && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Processing...</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {files.map((fileObj) => (
                  <div key={fileObj.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={fileObj.preview}
                        alt={fileObj.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 truncate">{fileObj.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(fileObj.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {compressedFiles.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Results
              </CardTitle>
              <Button onClick={downloadAll} className="bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Original Size</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatFileSize(stats.originalSize)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Compressed Size</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{formatFileSize(stats.compressedSize)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Folder className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Space Savings</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{stats.savings}%</p>
                </div>
              </div>

              {/* Compressed Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {compressedFiles.map((file, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                      <Badge variant="secondary">{file.format.toUpperCase()}</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Original Size:</span>
                        <span>{formatFileSize(file.originalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compressed Size:</span>
                        <span>{formatFileSize(file.compressedSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Savings:</span>
                        <span className="text-green-600 font-medium">{file.savings}%</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadFile(file.id)}
                      className="w-full mt-3"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      تحميل
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default App

