import { Toaster as SonnerToaster } from 'sonner';

const Toaster = () => {
    return (
        <SonnerToaster
            position="bottom-right"
            richColors
            expand={false}
            style={{ fontFamily: 'inherit' }}
        />
    );
};

export default Toaster;
