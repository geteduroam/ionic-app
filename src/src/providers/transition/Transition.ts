import { Animation } from 'ionic-angular/animations/animation';
import { PageTransition } from 'ionic-angular/transitions/page-transition'

export class Transition extends PageTransition {

  init() {
    super.init();
    const that = this;
    console.log('eso cabesa:', that);
    const enteringView = that.enteringView.pageRef();
    const leavingView = that.leavingView.pageRef();

    const leavingViewElAnimation = new Animation(that.plt, leavingView.nativeElement);

    leavingViewElAnimation
    .beforeStyles({ filter: 'blur(5px)' })
    .afterClearStyles(['filter']);
    console.log('transition: ',leavingViewElAnimation)
    that.add(leavingViewElAnimation);
  }

}
