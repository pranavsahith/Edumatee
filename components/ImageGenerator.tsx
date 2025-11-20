import React, { useState } from 'react';
import { generateImages } from '../services/geminiService';
import Header from './common/Header';
import { ImageIcon } from './icons';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [numImages, setNumImages] = useState(1);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate images.');
            return;
        }
        setIsLoading(true);
        setError('');
        setImages([]);

        try {
            const base64Images = await generateImages(prompt, numImages, aspectRatio);
            setImages(base64Images);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate images: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadImage = (base64Image: string, index: number) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64Image}`;
        link.download = `generated-image-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-800">
             {fullscreenImage && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setFullscreenImage(null)}
                >
                    <img 
                        src={`data:image/png;base64,${fullscreenImage}`} 
                        alt="Fullscreen generated image" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                        onClick={() => setFullscreenImage(null)} 
                        className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 transition-colors"
                        aria-label="Close fullscreen view"
                    >
                        &times;
                    </button>
                </div>
            )}
            <Header icon={<ImageIcon className="w-5 h-5"/>} title="AI Image Generator" />
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md mb-8">
                        <div className="space-y-4">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to create (e.g., 'A photorealistic cat wearing a spacesuit, high detail')..."
                                className="w-full h-24 p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 transition"
                                disabled={isLoading}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label htmlFor="num-images" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Images</label>
                                    <input
                                        id="num-images"
                                        type="number"
                                        min="1"
                                        max="4"
                                        value={numImages}
                                        onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
                                        className="mt-1 w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
                                    <select
                                        id="aspect-ratio"
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                                        className="mt-1 w-full p-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                                    >
                                        {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                                    </select>
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    className="w-full px-6 py-2 h-10 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition font-semibold"
                                >
                                    {isLoading ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    
                    {isLoading && (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    )}

                    {images.length > 0 && !isLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {images.map((img, index) => (
                                <div key={index} 
                                     className="group relative rounded-lg overflow-hidden shadow-lg cursor-pointer"
                                     onClick={() => setFullscreenImage(img)}
                                >
                                    <img src={`data:image/png;base64,${img}`} alt={`Generated image ${index + 1}`} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                downloadImage(img, index);
                                            }}
                                            className="px-4 py-2 bg-white/80 text-black font-semibold rounded-lg hover:bg-white">
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && images.length === 0 && (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                             <ImageIcon className="w-16 h-16 mx-auto mb-4"/>
                            <p>Your generated images will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;