import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Icon from '@/components/ui/icon';

const LOGO_URL = 'https://cdn.poehali.dev/projects/4402d97e-15af-4062-b89e-5d5fc4618802/bucket/98f97b9b-13cb-4716-b813-29f161b52964.png';

type View = 'home' | 'reviews' | 'search' | 'add' | 'profile' | 'admin' | 'support' | 'review-detail';

interface AppNavigationProps {
  currentView: View;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onNavigate: (view: View) => void;
  isAdmin: boolean;
}

export default function AppNavigation({ currentView, mobileMenuOpen, setMobileMenuOpen, onNavigate, isAdmin }: AppNavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <img src={LOGO_URL} alt="BANaNET" className="w-10 h-10 rounded-xl object-contain" />
            <h1 className="text-xl md:text-2xl font-bold gradient-text">BANa.NET</h1>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate('home')} className={`transition-colors font-medium ${currentView === 'home' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Главная
            </button>
            <button onClick={() => onNavigate('reviews')} className={`transition-colors font-medium ${currentView === 'reviews' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Отзывы
            </button>
            <button onClick={() => onNavigate('search')} className={`transition-colors font-medium ${currentView === 'search' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Поиск
            </button>
            <button onClick={() => onNavigate('add')} className={`transition-colors font-medium ${currentView === 'add' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Добавить отзыв
            </button>
            <button onClick={() => onNavigate('support')} className={`transition-colors font-medium ${currentView === 'support' ? 'text-primary' : 'text-foreground hover:text-primary'}`}>
              Поддержка
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button onClick={() => onNavigate('profile')} variant="outline" size="sm">
              <Icon name="User" className="w-4 h-4 mr-2" />
              Профиль
            </Button>
            {isAdmin && (
              <Button onClick={() => onNavigate('admin')} size="sm" className="gradient-bg">
                <Icon name="Shield" className="w-4 h-4 mr-2" />
                Админ
              </Button>
            )}
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Icon name="Menu" className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <img src={LOGO_URL} alt="BANaNET" className="w-10 h-10 rounded-xl object-contain" />
                  <span className="gradient-text">BANaNET</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Button onClick={() => onNavigate('home')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="Home" className="w-5 h-5 mr-3" />
                  Главная
                </Button>
                <Button onClick={() => onNavigate('reviews')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="MessageSquare" className="w-5 h-5 mr-3" />
                  Отзывы
                </Button>
                <Button onClick={() => onNavigate('search')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="Search" className="w-5 h-5 mr-3" />
                  Поиск
                </Button>
                <Button onClick={() => onNavigate('add')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="MessageSquarePlus" className="w-5 h-5 mr-3" />
                  Добавить отзыв
                </Button>
                <Button onClick={() => onNavigate('support')} variant="ghost" className="justify-start text-lg h-12">
                  <Icon name="HelpCircle" className="w-5 h-5 mr-3" />
                  Поддержка
                </Button>
                <div className="border-t pt-4 mt-4">
                  <Button onClick={() => onNavigate('profile')} variant="outline" className="w-full justify-start text-lg h-12 mb-3">
                    <Icon name="User" className="w-5 h-5 mr-3" />
                    Профиль
                  </Button>
                  {isAdmin && (
                    <Button onClick={() => onNavigate('admin')} className="w-full justify-start text-lg h-12 gradient-bg">
                      <Icon name="Shield" className="w-5 h-5 mr-3" />
                      Админ-панель
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}