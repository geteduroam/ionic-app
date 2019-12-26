import { Animation } from 'ionic-angular/animations/animation';
import { PageTransition } from 'ionic-angular/transitions/page-transition'

export class Transition extends PageTransition {

  init() {
    super.init();
    const that = this;

    const enteringView = that.enteringView.pageRef();
    const leavingView = that.leavingView.pageRef();

    const enteringViewElAnimation = new Animation(that.plt, enteringView.nativeElement);
    const leavingViewElAnimation = new Animation(that.plt, leavingView.nativeElement);

    enteringViewElAnimation.afterStyles({filter: 'blur(50px)' }).beforeStyles({opacity: 1})
    .afterClearStyles(['filter']).beforeClearStyles(['opacity']);
    that.add(enteringViewElAnimation);

    leavingViewElAnimation
    .beforeStyles({ filter: 'blur(5px)' })
    .afterClearStyles(['filter']);
    that.add(leavingViewElAnimation);
  }

}
