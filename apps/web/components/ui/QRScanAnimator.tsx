import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Scan, CheckCircle } from 'lucide-react';

interface QRScanAnimatorProps {
  qrCodeUrl?: string;
  onScanComplete?: (batchId: string) => void;
  batchId?: string;
}

export const QRScanAnimator = ({ qrCodeUrl, onScanComplete, batchId = 'BOX-001-DEMO' }: QRScanAnimatorProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const handleScan = () => {
    setIsScanning(true);
    setScanComplete(false);

    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      onScanComplete?.(batchId);

      // Reset after showing success
      setTimeout(() => {
        setScanComplete(false);
      }, 2000);
    }, 2500);
  };

  return (
    <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4">
          {/* QR Code Display */}
          <div className="relative w-48 h-48 bg-white rounded-lg flex items-center justify-center p-4">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Scan className="w-16 h-16 text-muted-foreground" />
              </div>
            )}

            {/* Scanning Animation Overlay */}
            <AnimatePresence>
              {isScanning && (
                <>
                  <motion.div
                    className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-primary shadow-lg shadow-primary/50"
                    initial={{ top: 0 }}
                    animate={{ top: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 border-2 border-primary rounded-lg"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Success Indicator */}
            <AnimatePresence>
              {scanComplete && (
                <motion.div
                  className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scan Button */}
          <Button
            onClick={handleScan}
            disabled={isScanning}
            className="w-full relative overflow-hidden group"
            size="lg"
          >
            <motion.div
              className="absolute inset-0 bg-primary/20"
              initial={false}
              animate={isScanning ? { x: ['-100%', '100%'] } : {}}
              transition={{ duration: 1, repeat: isScanning ? Infinity : 0, ease: 'linear' }}
            />
            <Scan className="mr-2 h-4 w-4" />
            {isScanning ? 'Scanning...' : scanComplete ? 'Scan Complete!' : 'Simulate Scan'}
          </Button>

          {/* Status Text */}
          <AnimatePresence mode="wait">
            {isScanning && (
              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Fetching provenance log...
              </motion.p>
            )}
            {scanComplete && (
              <motion.p
                className="text-sm text-green-500 font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Batch {batchId} verified!
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
